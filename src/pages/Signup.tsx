import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { BookOpen, ArrowLeft, GraduationCap, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/supabaseClient"; // ⬅️ tambahkan ini di atas

const Signup = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    role: "student" as "student" | "teacher",
    subject: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);

  // Validation
  if (!formData.fullName || !formData.email || !formData.password) {
    toast({
      title: "Error",
      description: "Please fill in all required fields",
      variant: "destructive",
    });
    setLoading(false);
    return;
  }

  if (formData.role === "teacher" && !formData.subject) {
    toast({
      title: "Error",
      description: "Please enter your subject",
      variant: "destructive",
    });
    setLoading(false);
    return;
  }

  // 1️⃣ REGISTER USER DI SUPABASE AUTH
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: formData.email,
    password: formData.password,
  });

  if (authError) {
    toast({
      title: "Signup failed",
      description: authError.message,
      variant: "destructive",
    });
    setLoading(false);
    return;
  }

  const userId = authData.user?.id;
  if (!userId) {
    toast({
      title: "Error",
      description: "User ID not found after signup.",
      variant: "destructive",
    });
    setLoading(false);
    return;
  }

  // 2️⃣ GENERATE TEACHER CODE (HANYA UNTUK TEACHER)
  let teacherCode: string | null = null;

  if (formData.role === "teacher") {
    const random = Math.floor(1000 + Math.random() * 9000);
    teacherCode = `${formData.subject.substring(0, 4).toUpperCase()}-${random}`;
  }

 // 3️⃣ UPDATE PROFILE (bukan insert)
const { error: updateError } = await supabase
  .from("profiles")
  .update({
    full_name: formData.fullName,
    role: formData.role,
    subject: formData.role === "teacher" ? formData.subject : null,
    teacher_code: teacherCode,
  })
  .eq("id", userId);

if (updateError) {
  toast({
    title: "Error saving profile",
    description: updateError.message,
    variant: "destructive",
  });
  setLoading(false);
  return;
}

  if (profileError) {
    toast({
      title: "Error saving profile",
      description: profileError.message,
      variant: "destructive",
    });
    setLoading(false);
    return;
  }

  // DONE 🎉
  toast({
    title: "Account created!",
    description: "You can now log in.",
  });

  navigate("/login");
  setLoading(false);
};


  return (
    <div className="min-h-screen gradient-hero">
      {/* Navigation */}
      <nav className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-primary">
              <BookOpen className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">ScoreTrack</span>
          </Link>
          <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
        </div>
      </nav>

      {/* Signup Form */}
      <div className="container mx-auto px-4 py-12">
        <div className="mx-auto max-w-md">
          <div className="rounded-2xl bg-card p-8 shadow-card animate-scale-in">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-card-foreground">Create Account</h1>
              <p className="mt-2 text-muted-foreground">Join ScoreTrack today</p>
            </div>

            <form onSubmit={handleSubmit} className="mt-8 space-y-6">
              {/* Full Name */}
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="Enter your full name"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="h-12"
                />
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="h-12"
                />
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Create a password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="h-12"
                />
              </div>

              {/* Role Selection */}
              <div className="space-y-3">
                <Label>I am a...</Label>
                <RadioGroup
                  value={formData.role}
                  onValueChange={(value: "student" | "teacher") => 
                    setFormData({ ...formData, role: value })
                  }
                  className="grid grid-cols-2 gap-4"
                >
                  <div>
                    <RadioGroupItem
                      value="student"
                      id="student"
                      className="peer sr-only"
                    />
                    <Label
                      htmlFor="student"
                      className="flex flex-col items-center justify-center rounded-xl border-2 border-border bg-background p-4 hover:bg-accent peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-accent cursor-pointer transition-all"
                    >
                      <User className="h-6 w-6 text-primary" />
                      <span className="mt-2 font-medium">Student</span>
                    </Label>
                  </div>
                  <div>
                    <RadioGroupItem
                      value="teacher"
                      id="teacher"
                      className="peer sr-only"
                    />
                    <Label
                      htmlFor="teacher"
                      className="flex flex-col items-center justify-center rounded-xl border-2 border-border bg-background p-4 hover:bg-accent peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-accent cursor-pointer transition-all"
                    >
                      <GraduationCap className="h-6 w-6 text-primary" />
                      <span className="mt-2 font-medium">Teacher</span>
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Subject (Teacher only) */}
              {formData.role === "teacher" && (
                <div className="space-y-2 animate-fade-in">
                  <Label htmlFor="subject">Subject</Label>
                  <Input
                    id="subject"
                    type="text"
                    placeholder="e.g., Mathematics, Biology, Physics"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="h-12"
                  />
                </div>
              )}

              {/* Submit Button */}
              <Button type="submit" variant="hero" size="lg" className="w-full" disabled={loading}>
                {loading ? "Creating Account..." : "Create Account"}
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link to="/login" className="font-medium text-primary hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;
