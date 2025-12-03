import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BookOpen, LogOut, Link2, Plus, BarChart3 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

// Mock data for demo
const mockStudent = {
  name: "Alice Johnson",
  email: "alice.johnson@student.edu",
};

interface ConnectedSubject {
  id: string;
  subject: string;
  teacherName: string;
  teacherCode: string;
  scores: { date: string; score: number }[];
}

const mockConnectedSubjects: ConnectedSubject[] = [
  {
    id: "1",
    subject: "Mathematics",
    teacherName: "John Smith",
    teacherCode: "MATH-4821",
    scores: [
      { date: "Sep 1", score: 75 },
      { date: "Sep 15", score: 82 },
      { date: "Oct 1", score: 78 },
      { date: "Oct 15", score: 88 },
      { date: "Nov 1", score: 92 },
    ],
  },
  {
    id: "2",
    subject: "Physics",
    teacherName: "Sarah Wilson",
    teacherCode: "PHYS-3492",
    scores: [
      { date: "Sep 5", score: 68 },
      { date: "Sep 20", score: 74 },
      { date: "Oct 5", score: 80 },
      { date: "Oct 20", score: 85 },
    ],
  },
];

const StudentDashboard = () => {
  const { toast } = useToast();
  const [teacherCode, setTeacherCode] = useState("");
  const [connectedSubjects, setConnectedSubjects] = useState<ConnectedSubject[]>(mockConnectedSubjects);
  const [connecting, setConnecting] = useState(false);

  const handleConnect = async () => {
    if (!teacherCode.trim()) {
      toast({
        title: "Error",
        description: "Please enter a teacher code",
        variant: "destructive",
      });
      return;
    }

    setConnecting(true);

    // Simulate connection (in production, this would verify with Supabase)
    setTimeout(() => {
      // Check if already connected
      if (connectedSubjects.some((s) => s.teacherCode === teacherCode.toUpperCase())) {
        toast({
          title: "Already Connected",
          description: "You are already connected to this teacher.",
          variant: "destructive",
        });
      } else {
        // For demo, add a mock connection
        const newSubject: ConnectedSubject = {
          id: Date.now().toString(),
          subject: "Biology",
          teacherName: "Dr. Michael Brown",
          teacherCode: teacherCode.toUpperCase(),
          scores: [],
        };
        setConnectedSubjects([...connectedSubjects, newSubject]);
        toast({
          title: "Connected!",
          description: `Successfully connected to ${newSubject.teacherName}'s ${newSubject.subject} class.`,
        });
      }
      setTeacherCode("");
      setConnecting(false);
    }, 1000);
  };

  const getBarColor = (score: number) => {
    if (score >= 90) return "hsl(142 71% 45%)"; // Green
    if (score >= 80) return "hsl(221 83% 53%)"; // Primary blue
    if (score >= 70) return "hsl(38 92% 50%)"; // Orange
    return "hsl(0 84% 60%)"; // Red
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
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
              <span className="hidden text-sm text-muted-foreground sm:inline">
                {mockStudent.name}
              </span>
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

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Student Dashboard</h1>
          <p className="mt-2 text-muted-foreground">View your scores and connect to teachers</p>
        </div>

        {/* Connect to Teacher */}
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
                placeholder="Enter teacher code (e.g., MATH-4821)"
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

        {/* Connected Subjects */}
        {connectedSubjects.length === 0 ? (
          <Card className="shadow-card animate-slide-up" style={{ animationDelay: "0.1s" }}>
            <CardContent className="py-12 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-accent">
                <BarChart3 className="h-8 w-8 text-accent-foreground" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-foreground">No subjects yet</h3>
              <p className="mt-2 text-muted-foreground">
                Connect to a teacher using their code to see your scores here.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-foreground">Your Subjects</h2>
            
            {/* Subjects Table */}
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
                      <TableRow key={subject.id}>
                        <TableCell className="font-medium">{subject.subject}</TableCell>
                        <TableCell>{subject.teacherName}</TableCell>
                        <TableCell className="text-center">{subject.scores.length}</TableCell>
                        <TableCell className="text-right">
                          {subject.scores.length > 0 ? (
                            <span
                              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-sm font-medium ${
                                subject.scores[subject.scores.length - 1].score >= 80
                                  ? "bg-green-100 text-green-800"
                                  : subject.scores[subject.scores.length - 1].score >= 70
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {subject.scores[subject.scores.length - 1].score}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">No scores</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Score Histograms */}
            <div className="grid gap-6 lg:grid-cols-2">
              {connectedSubjects.map((subject, index) => (
                <Card
                  key={subject.id}
                  className="shadow-card animate-slide-up"
                  style={{ animationDelay: `${0.2 + index * 0.1}s` }}
                >
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 text-primary" />
                      {subject.subject}
                    </CardTitle>
                    <CardDescription>
                      Teacher: {subject.teacherName} • Code: {subject.teacherCode}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {subject.scores.length > 0 ? (
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={subject.scores} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                            <XAxis
                              dataKey="date"
                              tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                              axisLine={{ stroke: "hsl(var(--border))" }}
                              tickLine={false}
                            />
                            <YAxis
                              domain={[0, 100]}
                              tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                              axisLine={{ stroke: "hsl(var(--border))" }}
                              tickLine={false}
                            />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: "hsl(var(--card))",
                                border: "1px solid hsl(var(--border))",
                                borderRadius: "8px",
                                boxShadow: "var(--shadow-card)",
                              }}
                              labelStyle={{ color: "hsl(var(--foreground))", fontWeight: 600 }}
                              itemStyle={{ color: "hsl(var(--muted-foreground))" }}
                            />
                            <Bar dataKey="score" radius={[4, 4, 0, 0]}>
                              {subject.scores.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={getBarColor(entry.score)} />
                              ))}
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
