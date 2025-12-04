// StudentDashboard.tsx
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { BookOpen, LogOut, Link2, Plus, BarChart3 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { supabase } from "@/supabaseClient";

type ScoreItem = { id: string; score: number; recorded_at: string };

type ConnectedSubject = {
  connectionId: string;
  teacherId: string;
  subject: string | null;
  teacherName: string | null;
  teacherCode: string | null;
  scores: ScoreItem[];
};

const StudentDashboard: React.FC = () => {
  const { toast } = useToast();
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [teacherCode, setTeacherCode] = useState("");
  const [connectedSubjects, setConnectedSubjects] = useState<
    ConnectedSubject[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [connecting, setConnecting] = useState(false);

  // -----------------------------
  // GET USER FROM AUTH
  // -----------------------------
  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getUser();
      const u = data?.user ?? null;
      setUserId(u?.id ?? null);
      setUserEmail(u?.email ?? null);
    };
    init();

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        const u = session?.user ?? null;
        setUserId(u?.id ?? null);
        setUserEmail(u?.email ?? null);

        if (!u) setConnectedSubjects([]);
      }
    );

    return () => {
      listener?.subscription?.unsubscribe();
    };
  }, []);

  // -----------------------------
  // LOAD CONNECTED TEACHERS
  // -----------------------------
  const loadConnections = async () => {
    if (!userId) return;

    setLoading(true);

    try {
      const { data: connections, error } = await supabase
        .from("student_teacher")
        .select(
          `
          id,
          connected_at,
          teacher:profiles (
            id,
            full_name,
            subject,
            teacher_code
          )
        `
        )
        .eq("student_id", userId)
        .order("connected_at", { ascending: false });

      if (error) throw error;

      if (!connections) {
        setConnectedSubjects([]);
        setLoading(false);
        return;
      }

      // Fetch nilai untuk tiap guru
      const mapped = await Promise.all(
        connections.map(async (c: any) => {
          const teacher = c.teacher ?? null;

          const { data: scoresData } = await supabase
            .from("scores")
            .select("id, score, recorded_at")
            .eq("student_id", userId)
            .eq("teacher_id", teacher?.id ?? null)
            .order("recorded_at", { ascending: true });

          const scores: ScoreItem[] = (scoresData ?? []).map((s: any) => ({
            id: s.id,
            score: s.score,
            recorded_at: s.recorded_at,
          }));

          return {
            connectionId: c.id,
            teacherId: teacher?.id ?? null,
            subject: teacher?.subject ?? null,
            teacherName: teacher?.full_name ?? null,
            teacherCode: teacher?.teacher_code ?? null,
            scores,
          } as ConnectedSubject;
        })
      );

      setConnectedSubjects(mapped);
    } catch (err: any) {
      console.error(err);
      toast({
        title: "Error",
        description: err.message ?? "Failed to load connections",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) loadConnections();
  }, [userId]);

  // -----------------------------
  // BAR CHART COLOR
  // -----------------------------
  const getBarColor = (score: number) => {
    if (score >= 90) return "hsl(142 71% 45%)";
    if (score >= 80) return "hsl(221 83% 53%)";
    if (score >= 70) return "hsl(38 92% 50%)";
    return "hsl(0 84% 60%)";
  };

  // -----------------------------
  // CONNECT TO TEACHER
  // -----------------------------
  const handleConnect = async () => {
    if (!teacherCode.trim()) {
      toast({
        title: "Error",
        description: "Please enter a teacher code",
        variant: "destructive",
      });
      return;
    }
    if (!userId) {
      toast({
        title: "Error",
        description: "User not authenticated",
        variant: "destructive",
      });
      return;
    }

    setConnecting(true);

    try {
      // Cari guru berdasarkan teacher_code
      const { data: teacher, error: teacherError } = await supabase
        .from("profiles")
        .select("id, full_name, subject, teacher_code")
        .ilike("teacher_code", teacherCode.trim())
        .limit(1)
        .maybeSingle();

      if (teacherError) throw teacherError;

      if (!teacher) {
        toast({
          title: "Not found",
          description: "Teacher code not found",
          variant: "destructive",
        });
        setConnecting(false);
        return;
      }

      // Cek apakah sudah konek sebelumnya
      const { data: existing } = await supabase
        .from("student_teacher")
        .select("id")
        .eq("student_id", userId)
        .eq("teacher_id", teacher.id)
        .maybeSingle();

      if (existing) {
        toast({
          title: "Already connected",
          description: "You're already connected to this teacher.",
          variant: "destructive",
        });
        setTeacherCode("");
        setConnecting(false);
        return;
      }

      // Tambahkan koneksi baru
      const { error: insertErr } = await supabase
        .from("student_teacher")
        .insert({
          student_id: userId,
          teacher_id: teacher.id,
        });

      if (insertErr) throw insertErr;

      toast({
        title: "Connected!",
        description: `Connected to ${teacher.full_name}.`,
      });

      setTeacherCode("");
      await loadConnections();
    } catch (err: any) {
      console.error(err);
      toast({
        title: "Error connecting",
        description: err?.message ?? "Failed to connect",
        variant: "destructive",
      });
    } finally {
      setConnecting(false);
    }
  };

  // -----------------------------
  // UI
  // -----------------------------
  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-primary">
                <BookOpen className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold text-foreground">
                ScoreTrack
              </span>
            </Link>

            <div className="flex items-center gap-4">
              <span className="hidden text-sm text-muted-foreground sm:inline">
                {userEmail ?? "Student"}
              </span>

              <Link to="/">
                <Button variant="ghost" size="sm">
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-8">
        {/* Connect to teacher */}
        <Card className="mb-8 shadow-card animate-slide-up">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Link2 className="h-5 w-5 text-primary" />
              Connect to Teacher
            </CardTitle>
            <CardDescription>
              Enter a teacher code to connect and receive scores
            </CardDescription>
          </CardHeader>

          <CardContent>
            <div className="flex gap-3">
              <Input
                placeholder="Enter teacher code"
                value={teacherCode}
                onChange={(e) => setTeacherCode(e.target.value.toUpperCase())}
                className="h-12 max-w-md font-mono uppercase"
              />

              <Button
                variant="hero"
                size="lg"
                onClick={handleConnect}
                disabled={connecting}
              >
                {connecting ? (
                  "Connecting..."
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Connect
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Empty */}
        {loading ? (
          <div>Loading...</div>
        ) : connectedSubjects.length === 0 ? (
          <Card className="shadow-card animate-slide-up">
            <CardContent className="py-12 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-accent">
                <BarChart3 className="h-8 w-8 text-accent-foreground" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-foreground">
                No subjects yet
              </h3>
              <p className="mt-2 text-muted-foreground">
                Connect to a teacher using their code to see your scores here.
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            <h2 className="text-xl font-semibold text-foreground mb-4">
              Your Subjects
            </h2>

            {/* Table */}
            <Card className="shadow-card mb-6">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Subject</TableHead>
                      <TableHead>Teacher</TableHead>
                      <TableHead className="text-center">Scores</TableHead>
                      <TableHead className="text-right">Latest</TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {connectedSubjects.map((subj) => (
                      <TableRow key={subj.connectionId}>
                        <TableCell>{subj.subject}</TableCell>
                        <TableCell>{subj.teacherName}</TableCell>
                        <TableCell className="text-center">
                          {subj.scores.length}
                        </TableCell>
                        <TableCell className="text-right">
                          {subj.scores.length > 0 ? (
                            <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-sm font-medium bg-green-100 text-green-800">
                              {
                                subj.scores[subj.scores.length - 1]
                                  .score
                              }
                            </span>
                          ) : (
                            <span className="text-muted-foreground">
                              No scores
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Charts */}
            <div className="grid gap-6 lg:grid-cols-2">
              {connectedSubjects.map((subject, i) => (
                <Card key={subject.connectionId} className="shadow-card">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 text-primary" />
                      {subject.subject}
                    </CardTitle>
                    <CardDescription>
                      Teacher: {subject.teacherName} • Code:{" "}
                      {subject.teacherCode}
                    </CardDescription>
                  </CardHeader>

                  <CardContent>
                    {subject.scores.length > 0 ? (
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={subject.scores.map((s) => ({
                              date: new Date(
                                s.recorded_at
                              ).toLocaleDateString(),
                              score: s.score,
                            }))}
                          >
                            <CartesianGrid
                              strokeDasharray="3 3"
                              vertical={false}
                            />
                            <XAxis dataKey="date" />
                            <YAxis domain={[0, 100]} />
                            <Tooltip />

                            <Bar dataKey="score" radius={[4, 4, 0, 0]}>
                              {subject.scores.map((entry, index) => (
                                <Cell
                                  key={index}
                                  fill={getBarColor(entry.score)}
                                />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <div className="flex h-64 items-center justify-center rounded-lg bg-muted">
                        <p className="text-muted-foreground">
                          No scores yet.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default StudentDashboard;
