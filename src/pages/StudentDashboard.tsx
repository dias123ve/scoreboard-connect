// StudentDashboard.tsx
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BookOpen, LogOut, Link2, Plus, BarChart3 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
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
  const [connectedSubjects, setConnectedSubjects] = useState<ConnectedSubject[]>([]);
  const [loading, setLoading] = useState(false);
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getUser();
      const user = data?.user ?? null;
      setUserId(user?.id ?? null);
      setUserEmail(user?.email ?? null);
    };
    init();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user ?? null;
      setUserId(u?.id ?? null);
      setUserEmail(u?.email ?? null);
      if (!u) setConnectedSubjects([]);
    });

    return () => {
      listener?.subscription?.unsubscribe();
    };
  }, []);

  const loadConnections = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const { data: connections, error } = await supabase
        .from("student_teacher_connections")
        .select(`
          id,
          connected_at,
          teacher:profiles (
            id,
            full_name,
            subject,
            teacher_code
          )
        `)
        .eq("student_id", userId)
        .order("connected_at", { ascending: false });

      if (error) throw error;
      if (!connections) {
        setConnectedSubjects([]);
        setLoading(false);
        return;
      }

      // fetch scores for each connection
      const mapped: ConnectedSubject[] = await Promise.all(
        connections.map(async (c: any) => {
          const teacher = c.teacher ?? null;
          const { data: scoresData, error: scoresError } = await supabase
            .from("scores")
            .select("id, score, recorded_at")
            .eq("student_id", userId)
            .eq("teacher_id", teacher?.id ?? null)
            .order("recorded_at", { ascending: true });

          if (scoresError) {
            console.warn("scores fetch error:", scoresError);
          }

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
        description: err?.message ?? "Failed to load connections",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) loadConnections();
  }, [userId]);

  const getBarColor = (score: number) => {
    if (score >= 90) return "hsl(142 71% 45%)";
    if (score >= 80) return "hsl(221 83% 53%)";
    if (score >= 70) return "hsl(38 92% 50%)";
    return "hsl(0 84% 60%)";
  };

  const handleConnect = async () => {
    if (!teacherCode.trim()) {
      toast({ title: "Error", description: "Please enter a teacher code", variant: "destructive" });
      return;
    }
    if (!userId) {
      toast({ title: "Error", description: "User not authenticated", variant: "destructive" });
      return;
    }

    setConnecting(true);
    try {
      const { data: teacher, error: teacherError } = await supabase
        .from("profiles")
        .select("id, full_name, subject, teacher_code")
        .ilike("teacher_code", teacherCode.trim())
        .limit(1)
        .single();

      if (teacherError) throw teacherError;
      if (!teacher) {
        toast({ title: "Not found", description: "Teacher code not found", variant: "destructive" });
        setConnecting(false);
        return;
      }

      // check existing
      const { data: existing, error: existingErr } = await supabase
        .from("student_teacher_connections")
        .select("id")
        .eq("student_id", userId)
        .eq("teacher_id", teacher.id)
        .single();

      if (!existingErr && existing) {
        toast({ title: "Already connected", description: "You're already connected to this teacher.", variant: "destructive" });
        setTeacherCode("");
        setConnecting(false);
        return;
      }

      const { error: insertErr } = await supabase
        .from("student_teacher_connections")
        .insert({ student_id: userId, teacher_id: teacher.id });

      if (insertErr) throw insertErr;

      toast({ title: "Connected!", description: `Connected to ${teacher.full_name ?? "teacher"}.` });
      setTeacherCode("");
      await loadConnections();
    } catch (err: any) {
      console.error(err);
      toast({ title: "Error connecting", description: err?.message ?? "Failed to connect", variant: "destructive" });
    } finally {
      setConnecting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-primary">
                <BookOpen className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold text-foreground">ScoreTrack</span>
            </Link>
            <div className="flex items-center gap-4">
              <span className="hidden text-sm text-muted-foreground sm:inline">{userEmail ?? "Student"}</span>
              <Link to="/">
                <Button variant="ghost" size="sm" className="text-muted-foreground">
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Student Dashboard</h1>
          <p className="mt-2 text-muted-foreground">View your scores and connect to teachers</p>
        </div>

        <Card className="mb-8 shadow-card animate-slide-up">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Link2 className="h-5 w-5 text-primary" />
              Connect to Teacher
            </CardTitle>
            <CardDescription>Enter a teacher code to connect and receive scores</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3">
              <Input placeholder="Enter teacher code (e.g., MATH-4821)" value={teacherCode} onChange={(e) => setTeacherCode(e.target.value.toUpperCase())} className="h-12 max-w-md font-mono uppercase" />
              <Button variant="hero" size="lg" onClick={handleConnect} disabled={connecting}>{connecting ? "Connecting..." : (<><Plus className="mr-2 h-4 w-4" />Connect</>)}</Button>
            </div>
          </CardContent>
        </Card>

        {loading ? <div>Loading...</div> : connectedSubjects.length === 0 ? (
          <Card className="shadow-card animate-slide-up" style={{ animationDelay: "0.1s" }}>
            <CardContent className="py-12 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-accent">
                <BarChart3 className="h-8 w-8 text-accent-foreground" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-foreground">No subjects yet</h3>
              <p className="mt-2 text-muted-foreground">Connect to a teacher using their code to see your scores here.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-foreground">Your Subjects</h2>

            <Card className="shadow-card animate-slide-up" style={{ animationDelay: "0.1s" }}>
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
                    {connectedSubjects.map((subject) => (
                      <TableRow key={subject.connectionId}>
                        <TableCell className="font-medium">{subject.subject ?? "—"}</TableCell>
                        <TableCell>{subject.teacherName ?? "—"}</TableCell>
                        <TableCell className="text-center">{subject.scores.length}</TableCell>
                        <TableCell className="text-right">
                          {subject.scores.length > 0 ? (
                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-sm font-medium ${subject.scores[subject.scores.length - 1].score >= 80 ? "bg-green-100 text-green-800" : subject.scores[subject.scores.length - 1].score >= 70 ? "bg-yellow-100 text-yellow-800" : "bg-red-100 text-red-800"}`}>
                              {subject.scores[subject.scores.length - 1].score}
                            </span>
                          ) : <span className="text-muted-foreground">No scores</span>}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <div className="grid gap-6 lg:grid-cols-2">
              {connectedSubjects.map((subject, index) => (
                <Card key={subject.connectionId} className="shadow-card animate-slide-up" style={{ animationDelay: `${0.2 + index * 0.1}s` }}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 text-primary" />
                      {subject.subject ?? "Subject"}
                    </CardTitle>
                    <CardDescription>
                      Teacher: {subject.teacherName ?? "—"} • Code: {subject.teacherCode ?? "—"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {subject.scores.length > 0 ? (
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={subject.scores.map(s => ({ date: new Date(s.recorded_at).toLocaleDateString(), score: s.score }))} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                            <XAxis dataKey="date" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} axisLine={{ stroke: "hsl(var(--border))" }} tickLine={false} />
                            <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} axisLine={{ stroke: "hsl(var(--border))" }} tickLine={false} />
                            <Tooltip />
                            <Bar dataKey="score" radius={[4,4,0,0]}>
                              {subject.scores.map((entry, i) => <Cell key={`c-${i}`} fill={getBarColor(entry.score)} />)}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <div className="flex h-64 items-center justify-center rounded-lg bg-muted">
                        <p className="text-muted-foreground">No scores yet. Check back after your teacher uploads scores.</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default StudentDashboard;
