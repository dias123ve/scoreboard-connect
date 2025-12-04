import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  BookOpen,
  Download,
  Upload,
  LogOut,
  Copy,
  CheckCircle,
  FileSpreadsheet,
  Users,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import * as XLSX from "xlsx";

const TeacherDashboard = () => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [teacher, setTeacher] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  const [connectedStudents, setConnectedStudents] = useState(0);
  const [uploadedCount, setUploadedCount] = useState(0);
  const [totalScores, setTotalScores] = useState(0);

  // 🔥 Load teacher profile on mount
  useEffect(() => {
    const loadProfile = async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user?.user) return;

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.user.id)
        .single();

      if (error) {
        console.error(error);
        return;
      }

      setTeacher(data);
    };

    loadProfile();
  }, []);

  // 🔥 Load statistics
  useEffect(() => {
    if (!teacher) return;
    loadConnections();
    loadStats();
  }, [teacher]);

  const loadConnections = async () => {
    const { data, error } = await supabase
      .from("student_teacher")
      .select("id")
      .eq("teacher_id", teacher.id);

    if (!error && data) setConnectedStudents(data.length);
  };

  const loadStats = async () => {
    const { data, error } = await supabase
      .from("scores")
      .select("id")
      .eq("teacher_id", teacher.id);

    if (!error && data) setTotalScores(data.length);
  };

  // Copy teacher code
  const copyTeacherCode = () => {
    navigator.clipboard.writeText(teacher.teacher_code);
    setCopied(true);
    toast({
      title: "Copied!",
      description: "Teacher code copied to clipboard",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  // Download Excel Template
  const downloadTemplate = () => {
    const ws = XLSX.utils.aoa_to_sheet([["Student Email", "Score"]]);
    ws["!cols"] = [{ wch: 25 }, { wch: 10 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Scores");
    XLSX.writeFile(wb, "score_template.xlsx");

    toast({
      title: "Template downloaded",
      description: "Fill student email + score then upload.",
    });
  };

  // Upload Excel → Insert into Supabase
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf);
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json(sheet);

      const clean = json.filter((x: any) => x["Student Email"] && x["Score"]);

      if (clean.length === 0) {
        toast({
          title: "Error",
          description: "File has no valid rows.",
          variant: "destructive",
        });
        return;
      }

      // Insert scores
      const payload = clean.map((row: any) => ({
        teacher_id: teacher.id,
        student_email: row["Student Email"],
        score: Number(row["Score"]),
      }));

      const { error } = await supabase.from("scores").insert(payload);
      if (error) throw error;

      setUploadedCount(clean.length);
      loadStats();

      toast({
        title: "Uploaded!",
        description: `${clean.length} scores saved.`,
      });
    } catch (err) {
      toast({
        title: "Error reading file",
        description: "Make sure format is correct.",
        variant: "destructive",
      });
    }

    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  if (!teacher) return <div className="p-10">Loading dashboard...</div>;

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-primary">
              <BookOpen className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">ScoreTrack</span>
          </Link>
          <Link to="/">
            <Button variant="ghost">
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </Link>
        </div>
      </nav>

      {/* Main */}
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold">Teacher Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Manage your students and scores
        </p>

        <div className="grid gap-6 mt-8 md:grid-cols-2 lg:grid-cols-3">
          {/* Profile */}
          <Card>
            <CardHeader>
              <CardTitle>Profile</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p><strong>Name:</strong> {teacher.full_name}</p>
              <p><strong>Subject:</strong> {teacher.subject}</p>

              <div>
                <p className="text-sm">Teacher Code</p>
                <div className="flex items-center gap-2 mt-1">
                  <code className="px-3 py-2 bg-accent rounded-lg">
                    {teacher.teacher_code}
                  </code>
                  <Button size="icon" variant="ghost" onClick={copyTeacherCode}>
                    {copied ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Template */}
          <Card>
            <CardHeader>
              <CardTitle>Excel Template</CardTitle>
              <CardDescription>
                Download and fill in student scores.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={downloadTemplate} variant="outline" className="w-full">
                <Download className="mr-2 h-4 w-4" />
                Download Template
              </Button>
            </CardContent>
          </Card>

          {/* Upload */}
          <Card>
            <CardHeader>
              <CardTitle>Upload Scores</CardTitle>
              <CardDescription>Upload completed Excel</CardDescription>
            </CardHeader>
            <CardContent>
              <input
                type="file"
                ref={fileInputRef}
                accept=".xlsx,.xls"
                className="hidden"
                onChange={handleFileUpload}
              />
              <Button className="w-full" onClick={() => fileInputRef.current?.click()}>
                <Upload className="mr-2 h-4 w-4" />
                Upload Excel
              </Button>

              {uploadedCount > 0 && (
                <div className="mt-4 flex items-center gap-2 p-3 bg-green-50 text-green-700 rounded-lg">
                  <CheckCircle className="h-5 w-5" />
                  {uploadedCount} scores uploaded.
                </div>
              )}
            </CardContent>
          </Card>

          {/* Stats */}
          <Card className="md:col-span-2 lg:col-span-3">
            <CardHeader>
              <CardTitle>Quick Stats</CardTitle>
            </CardHeader>
            <CardContent className="grid sm:grid-cols-3 gap-4">
              <div className="p-6 bg-accent rounded-xl text-center">
                <p className="text-3xl font-bold">{connectedStudents}</p>
                <p className="text-sm">Connected Students</p>
              </div>
              <div className="p-6 bg-accent rounded-xl text-center">
                <p className="text-3xl font-bold">{totalScores}</p>
                <p className="text-sm">Scores Uploaded</p>
              </div>
              <div className="p-6 bg-accent rounded-xl text-center">
                <p className="text-3xl font-bold">{uploadedCount}</p>
                <p className="text-sm">This Session Upload</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default TeacherDashboard;
