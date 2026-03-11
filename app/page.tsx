// @ts-nocheck
'use client';

import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://yfzymtrapibbjytzcuee.supabase.co";
const supabaseKey = "sb_publishable_RBfBuWmFt-tCRjm9glgYVg_xX6JT-Yl";
const supabase = createClient(supabaseUrl, supabaseKey);

const days = [
  { label: "Sunday", value: 0 },
  { label: "Monday", value: 1 },
  { label: "Tuesday", value: 2 },
  { label: "Wednesday", value: 3 },
  { label: "Thursday", value: 4 },
  { label: "Friday", value: 5 },
  { label: "Saturday", value: 6 },
];

const packages = {
  Silver: 4,
  Gold: 8,
  Platinum: 12,
};

const MONTHLY_TUITION = 2500;
const TEACHER_PER_LESSON = 250;

function countLessonDaysMultiple(startDate, lessonDays) {

  if (!startDate) return 0;

  const start = new Date(startDate);
  const today = new Date();

  let count = 0;
  const d = new Date(start);

  while (d <= today) {
    if (lessonDays.includes(d.getDay())) count++;
    d.setDate(d.getDate() + 1);
  }

  return count;
}

export default function FirstBeatAdminPortal() {

  const [students, setStudents] = useState([]);

  const [newStudent, setNewStudent] = useState("");
  const [instrument, setInstrument] = useState("");
  const [teacher, setTeacher] = useState("");
  const [pkg, setPkg] = useState("Silver");
  const [lessonDays, setLessonDays] = useState([6]);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState("");

  const toggleDay = (day) => {

    if (lessonDays.includes(day)) {
      setLessonDays(lessonDays.filter((d) => d !== day));
    } else {
      setLessonDays([...lessonDays, day]);
    }

  };

  const loadStudents = async () => {

    const { data } = await supabase.from("students").select("*");

    if (data) setStudents(data);

  };

  useEffect(() => {
    loadStudents();
  }, []);

  const addStudent = async () => {

    const newEntry = {
      name: newStudent,
      instrument: instrument,
      teacher: teacher,
      package: pkg,
      lessonDays: lessonDays,
      paymentAmount: paymentAmount ? Number(paymentAmount) : 0,
      paymentDate: paymentDate || null,
      absences: 0,
    };

    await supabase.from("students").insert([newEntry]);

    setNewStudent("");
    setInstrument("");
    setTeacher("");
    setPaymentAmount("");
    setPaymentDate("");

    loadStudents();
  };

  const deleteStudent = async (id) => {

    await supabase.from("students").delete().eq("id", id);
    loadStudents();

  };

  const markAbsent = async (s) => {

    await supabase
      .from("students")
      .update({ absences: (s.absences || 0) + 1 })
      .eq("id", s.id);

    loadStudents();

  };

  const renewPayment = async (s) => {

    const today = new Date().toISOString().split("T")[0];

    const newAmount = Number(s.paymentAmount || 0) + MONTHLY_TUITION;

    await supabase
      .from("students")
      .update({
        paymentDate: today,
        paymentAmount: newAmount,
        absences: 0
      })
      .eq("id", s.id);

    loadStudents();

  };

  const totalIncome = students.reduce(
    (sum, s) => sum + Number(s.paymentAmount || 0),
    0
  );

  const totalLessonsUsed = students.reduce((sum, s) => {

    const studentDays = s.lessonDays || [s.lessonDay];

    const usedLessons = Math.max(
      0,
      countLessonDaysMultiple(s.paymentDate, studentDays) - (s.absences || 0)
    );

    return sum + usedLessons;

  }, 0);

  const totalTeacherPay = totalLessonsUsed * TEACHER_PER_LESSON;

  const studioNetIncome = totalIncome - totalTeacherPay;

  const teacherTotals = {};

  students.forEach((s) => {

    const studentDays = s.lessonDays || [s.lessonDay];

    const usedLessons = Math.max(
      0,
      countLessonDaysMultiple(s.paymentDate, studentDays) - (s.absences || 0)
    );

    const pay = usedLessons * TEACHER_PER_LESSON;

    if (!teacherTotals[s.teacher]) teacherTotals[s.teacher] = 0;

    teacherTotals[s.teacher] += pay;

  });

  const today = new Date().getDay();

  const todaysStudents = students.filter((s) => {

    const studentDays = s.lessonDays || [s.lessonDay];

    return studentDays.includes(today);

  });

  const paymentDueCount = students.filter((s) => {

    const studentDays = s.lessonDays || [s.lessonDay];

    const usedLessons = Math.max(
      0,
      countLessonDaysMultiple(s.paymentDate, studentDays) - (s.absences || 0)
    );

    const limit = packages[s.package || "Silver"];

    const lessonsLeft = Math.max(0, limit - usedLessons);

    return lessonsLeft === 0;

  }).length;

  return (

    <div className="p-6 grid gap-6">

      <h1 className="text-3xl font-bold">
        First Beat Music Studio – Admin Portal
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">

        <div className="p-4 border rounded-2xl shadow">
          <p>Total Students</p>
          <p className="text-xl font-bold">{students.length}</p>
        </div>

        <div className="p-4 border rounded-2xl shadow">
          <p>Total Tuition</p>
          <p className="text-xl font-bold">₱{totalIncome}</p>
        </div>

        <div className="p-4 border rounded-2xl shadow">
          <p>Teacher Pay</p>
          <p className="text-xl font-bold">₱{totalTeacherPay}</p>
        </div>

        <div className="p-4 border rounded-2xl shadow">
          <p>Studio Net</p>
          <p className="text-xl font-bold">₱{studioNetIncome}</p>
        </div>

        <div className="p-4 border rounded-2xl shadow">
          <p>Today's Lessons</p>
          <p className="text-xl font-bold">{todaysStudents.length}</p>
        </div>

        <div className="p-4 border rounded-2xl shadow">
          <p>Payment Due</p>
          <p className="text-xl font-bold">{paymentDueCount}</p>
        </div>

      </div>

      <div className="border rounded-2xl shadow p-4">

        <h2 className="text-xl font-semibold mb-4">Teacher Payroll</h2>

        {Object.entries(teacherTotals).map(([t, amount]) => (

          <p key={t}>
            {t} — ₱{amount}
          </p>

        ))}

      </div>

      <div className="border rounded-2xl shadow p-4">

        <h2 className="text-xl font-semibold mb-4">Students</h2>

        {students.map((s) => (

          <div key={s.id} className="border p-3 rounded mb-2">

            <p className="font-bold">{s.name}</p>
            <p>Instrument: {s.instrument}</p>
            <p>Teacher: {s.teacher}</p>

            <div className="flex gap-2 mt-2">

              <button
                className="border px-3 py-1 rounded"
                onClick={() => markAbsent(s)}
              >
                Absent
              </button>

              <button
                className="bg-green-600 text-white px-3 py-1 rounded"
                onClick={() => renewPayment(s)}
              >
                Renew
              </button>

              <button
                className="bg-red-600 text-white px-3 py-1 rounded"
                onClick={() => deleteStudent(s.id)}
              >
                Delete
              </button>

            </div>

          </div>

        ))}

      </div>

    </div>

  );

}