import { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Download, Upload, LogOut, Copy, CheckCircle, FileSpreadsheet, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import * as XLSX from "xlsx";

// Mock data for demo purposes
const mockTeacher = {
  name: "John Smith",
  email: "john.smith@school.edu",
  subject: "Mathematics",
  teacherCode: "MATH-4821",
};

const TeacherDashboard = () => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [copied, setCopied] = useState(false);
  const [uploadedCount, setUploadedCount] = useState(0);

  const copyTeacherCode = () => {
    navigator.clipboard.writeText(mockTeacher.teacherCode);
    setCopied(true);
    toast({
      title: "Copied!",
      description: "Teacher code copied to clipboard",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadTemplate = () => {
    // Create workbook with template
    const ws = XLSX.utils.aoa_to_sheet([
      ["Student Email", "Score"],
      ["student1@email.com", "85"],
      ["student2@email.com", "92"],
      ["student3@email.com", "78"],
    ]);

    // Set column widths
    ws["!cols"] = [{ wch: 25 }, { wch: 10 }];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Scores");

    // Download
    XLSX.writeFile(wb, "score_template.xlsx");

    toast({
      title: "Template Downloaded",
      description: "Fill in student emails and scores, then upload.",
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json<{ "Student Email": string; Score: number }>(worksheet);

      // Validate data
      const validEntries = jsonData.filter(
        (row) => row["Student Email"] && typeof row["Score"] === "number"
      );

      if (validEntries.length === 0) {
        toast({
          title: "Error",
          description: "No valid data found in the file. Please check the format.",
          variant: "destructive",
        });
        return;
      }

      // In production, this would upload to Supabase
      setUploadedCount(validEntries.length);
      
      toast({
        title: "Scores Uploaded!",
        description: `${validEntries.length} student scores successfully uploaded.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to read the Excel file. Please check the format.",
        variant: "destructive",
      });
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
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
            <Link to="/">
              <Button variant="ghost" size="sm" className="text-muted-foreground">
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Teacher Dashboard</h1>
          <p className="mt-2 text-muted-foreground">Manage your students and scores</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Teacher Profile Card */}
          <Card className="shadow-card animate-slide-up">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent">
                  <span className="text-lg font-bold text-accent-foreground">
                    {mockTeacher.name.charAt(0)}
                  </span>
                </div>
                Profile
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Name</p>
                <p className="font-medium text-foreground">{mockTeacher.name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Subject</p>
                <p className="font-medium text-foreground">{mockTeacher.subject}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Teacher Code</p>
                <div className="mt-1 flex items-center gap-2">
                  <code className="rounded-lg bg-accent px-3 py-2 text-lg font-bold text-accent-foreground">
                    {mockTeacher.teacherCode}
                  </code>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={copyTeacherCode}
                    className="shrink-0"
                  >
                    {copied ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  Share this code with your students
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Download Template Card */}
          <Card className="shadow-card animate-slide-up" style={{ animationDelay: "0.1s" }}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5 text-primary" />
                Excel Template
              </CardTitle>
              <CardDescription>
                Download the score template to fill in student data
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={downloadTemplate} variant="outline" className="w-full">
                <Download className="mr-2 h-4 w-4" />
                Download Template
              </Button>
              <div className="mt-4 rounded-lg bg-muted p-4 text-sm">
                <p className="font-medium text-foreground">Template Format:</p>
                <ul className="mt-2 list-inside list-disc text-muted-foreground">
                  <li>Column A: Student Email</li>
                  <li>Column B: Score</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Upload Scores Card */}
          <Card className="shadow-card animate-slide-up" style={{ animationDelay: "0.2s" }}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5 text-primary" />
                Upload Scores
              </CardTitle>
              <CardDescription>
                Upload filled Excel file to distribute scores
              </CardDescription>
            </CardHeader>
            <CardContent>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload"
              />
              <Button
                variant="hero"
                className="w-full"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="mr-2 h-4 w-4" />
                Upload Excel File
              </Button>
              {uploadedCount > 0 && (
                <div className="mt-4 flex items-center gap-2 rounded-lg bg-green-50 p-3 text-green-700">
                  <CheckCircle className="h-5 w-5" />
                  <span className="text-sm font-medium">
                    {uploadedCount} scores uploaded successfully
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Stats Card */}
          <Card className="shadow-card animate-slide-up md:col-span-2 lg:col-span-3" style={{ animationDelay: "0.3s" }}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Quick Stats
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-xl bg-accent p-6 text-center">
                  <p className="text-3xl font-bold text-accent-foreground">0</p>
                  <p className="mt-1 text-sm text-muted-foreground">Connected Students</p>
                </div>
                <div className="rounded-xl bg-accent p-6 text-center">
                  <p className="text-3xl font-bold text-accent-foreground">0</p>
                  <p className="mt-1 text-sm text-muted-foreground">Scores Uploaded</p>
                </div>
                <div className="rounded-xl bg-accent p-6 text-center">
                  <p className="text-3xl font-bold text-accent-foreground">0</p>
                  <p className="mt-1 text-sm text-muted-foreground">Upload Sessions</p>
                </div>
              </div>
              <p className="mt-4 text-center text-sm text-muted-foreground">
                Connect Supabase to enable data persistence and real statistics.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default TeacherDashboard;
