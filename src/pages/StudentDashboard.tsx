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
import { toast } from "@/components/ui/use-toast";
import supabase from "@/lib/supabaseClient";

interface Connection {
  id: string;
  full_name: string | null;
  subject: string | null;
  teacher_code: string | null;
}

const StudentDashboard = () => {
  const [teacherCode, setTeacherCode] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);

  // =============================
  // LOAD CURRENT USER
  // =============================
  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUserId(data.user?.id ?? null);
    };
    getUser();
  }, []);

  // =============================
  // LOAD CONNECTIONS
  // =============================
  useEffect(() => {
    if (!userId) return;
    loadConnections();
  }, [userId]);

  const loadConnections = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("student_teacher")
        .select(
          `
          id,
          teacher:profiles (
            id,
            full_name,
            subject,
            teacher_code
          )
        `
        )
        .eq("student_id", userId);

      if (error) throw error;

      const formatted = data.map((item: any) => ({
        id: item.teacher?.id,
        full_name: item.teacher?.full_name,
        subject: item.teacher?.subject,
        teacher_code: item.teacher?.teacher_code,
      }));

      setConnections(formatted);
    } catch (err) {
      console.error(err);
      toast({
        title: "Error loading data",
        description: "Failed to load teacher connections.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // =============================
  // CONNECT HANDLER
  // =============================
  const handleConnect = async () => {
    if (!teacherCode.trim()) {
      toast({
        title: "Invalid code",
        description: "Please enter a teacher code.",
        variant: "destructive",
      });
      return;
    }

    setConnecting(true);

    try {
      // 1. Cari teacher
      const { data: teachers, error: teacherError } = await supabase
        .from("profiles")
        .select("id, full_name, subject, teacher_code")
        .ilike("teacher_code", teacherCode.trim());

      if (teacherError) throw teacherError;

      const teacher = teachers?.[0] ?? null;

      if (!teacher) {
        toast({
          title: "Teacher not found",
          description: "No teacher matches that code.",
          variant: "destructive",
        });
        return;
      }

      // 2. Cek apakah sudah terhubung
      const { data: existing } = await supabase
        .from("student_teacher")
        .select("id")
        .eq("student_id", userId)
        .eq("teacher_id", teacher.id)
        .maybeSingle();

      if (existing) {
        toast({
          title: "Already connected",
          description: "You are already connected with this teacher.",
          variant: "destructive",
        });
        setTeacherCode("");
        return;
      }

      // 3. Insert new connection
      const { error: insertError } = await supabase
        .from("student_teacher")
        .insert({
          student_id: userId,
          teacher_id: teacher.id,
        });

      if (insertError) throw insertError;

      toast({
        title: "Connected!",
        description: `You are now connected to ${teacher.full_name}.`,
      });

      setTeacherCode("");
      await loadConnections();
    } catch (err: any) {
      console.error(err);
      toast({
        title: "Connection error",
        description: err?.message ?? "Failed to connect.",
        variant: "destructive",
      });
    } finally {
      setConnecting(false);
    }
  };

  // =============================
  // RENDER UI
  // =============================

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Student Dashboard</h1>

      {/* Connect to Teacher */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Connect to Teacher</CardTitle>
          <CardDescription>
            Enter the teacher code to connect with your teacher.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex gap-4">
          <Input
            placeholder="Enter teacher code"
            value={teacherCode}
            onChange={(e) => setTeacherCode(e.target.value)}
          />
          <Button onClick={handleConnect} disabled={connecting}>
            {connecting ? "Connecting..." : "Connect"}
          </Button>
        </CardContent>
      </Card>

      {/* Connected Teachers */}
      <Card>
        <CardHeader>
          <CardTitle>Your Teachers</CardTitle>
          <CardDescription>
            These are the teachers you are connected to.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p>Loading...</p>
          ) : connections.length === 0 ? (
            <p className="text-muted-foreground">No teachers connected yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Code</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {connections.map((teacher, idx) => (
                  <TableRow key={idx}>
                    <TableCell>{teacher.full_name}</TableCell>
                    <TableCell>{teacher.subject}</TableCell>
                    <TableCell>{teacher.teacher_code}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default StudentDashboard;
