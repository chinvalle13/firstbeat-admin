// @ts-nocheck
'use client';

import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

// SUPABASE CONFIG
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
    if (!newStudent) {
      alert("Please enter a student name");
      return;
    }

    const newEntry = {
      name: newStudent,
      instrument: instrument || "TBD",
      package: pkg,
      lessonDays: lessonDays, // stored as array in Supabase (jsonb)
      paymentAmount: paymentAmount ? Number(paymentAmount) : null,
      paymentDate: paymentDate || null,
      absences: 0,
    };

    const { error } = await supabase.from("students").insert([newEntry]);

    if (error) {
      console.error("INSERT ERROR:", error);
      alert("Student was not saved. Check Supabase table columns (package, lessonDays).
Open Supabase → Table Editor → students.");
      return;
    }

    setNewStudent("");
    setInstrument("");
    setPaymentAmount("");
    setPaymentDate("");
    setLessonDays([6]);

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

    await supabase
      .from("students")
      .update({ paymentDate: today, absences: 0 })
      .eq("id", s.id);

    loadStudents();
  };

  const totalIncome = students.reduce(
    (sum, s) => sum + Number(s.paymentAmount || 0),
    0
  );

  const sortedStudents = [...students].sort((a, b) =>
    a.name.localeCompare(b.name)
  );

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

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 border rounded-2xl shadow">
          <p className="text-sm">Total Students</p>
          <p className="text-xl font-bold">{students.length}</p>
        </div>

        <div className="p-4 border rounded-2xl shadow">
          <p className="text-sm">Total Tuition Collected</p>
          <p className="text-xl font-bold">₱{totalIncome}</p>
        </div>

        <div className="p-4 border rounded-2xl shadow">
          <p className="text-sm">Today's Schedule</p>
          <p className="text-xl font-bold">{todaysStudents.length}</p>
        </div>

        <div className="p-4 border rounded-2xl shadow">
          <p className="text-sm">Students With Payment Due</p>
          <p className="text-xl font-bold">{paymentDueCount}</p>
        </div>
      </div>

      {/* TODAY'S LESSONS LIST */}

      <div className="border rounded-2xl shadow p-4">
        <h2 className="text-xl font-semibold mb-4">Today's Lessons</h2>

        {todaysStudents.length === 0 && (
          <p className="text-sm text-gray-500">No lessons scheduled today.</p>
        )}

        <div className="space-y-2">
          {todaysStudents.map((s) => (
            <div key={s.id} className="border p-2 rounded">
              {s.name} – {s.instrument}
            </div>
          ))}
        </div>
      </div>

      {/* ADD STUDENT */}

      <div className="border rounded-2xl shadow p-4">
        <h2 className="text-xl font-semibold mb-4">Add Student</h2>

        <div className="grid gap-2 md:grid-cols-3">
          <input
            className="border p-2 rounded"
            placeholder="Student Name"
            value={newStudent}
            onChange={(e) => setNewStudent(e.target.value)}
          />

          <input
            className="border p-2 rounded"
            placeholder="Instrument"
            value={instrument}
            onChange={(e) => setInstrument(e.target.value)}
          />

          <select
            className="border p-2 rounded"
            value={pkg}
            onChange={(e) => setPkg(e.target.value)}
          >
            <option>Silver</option>
            <option>Gold</option>
            <option>Platinum</option>
          </select>

          <input
            className="border p-2 rounded"
            placeholder="Payment Amount"
            value={paymentAmount}
            onChange={(e) => setPaymentAmount(e.target.value)}
          />

          <input
            type="date"
            className="border p-2 rounded"
            value={paymentDate}
            onChange={(e) => setPaymentDate(e.target.value)}
          />
        </div>

        <p className="mt-3 text-sm font-semibold">Lesson Days</p>

        <div className="flex flex-wrap gap-2">
          {days.map((d) => (
            <button
              key={d.value}
              className={`px-3 py-1 border rounded ${lessonDays.includes(d.value) ? "bg-black text-white" : ""}`}
              onClick={() => toggleDay(d.value)}
            >
              {d.label}
            </button>
          ))}
        </div>

        <button
          className="bg-black text-white px-4 py-2 rounded mt-4"
          onClick={addStudent}
        >
          Add
        </button>
      </div>

      {/* STUDENT LIST */}

      <div className="border rounded-2xl shadow p-4">
        <h2 className="text-xl font-semibold mb-4">Student List</h2>

        <div className="space-y-4">
          {sortedStudents.map((s) => {
            const studentDays = s.lessonDays || [s.lessonDay];

            const dayLabels = studentDays
              .map((d) => days.find((x) => x.value === d)?.label)
              .join(", ");

            const usedLessons = Math.max(
              0,
              countLessonDaysMultiple(s.paymentDate, studentDays) - (s.absences || 0)
            );

            const limit = packages[s.package || "Silver"];

            const lessonsLeft = Math.max(0, limit - usedLessons);

            const paymentDue = lessonsLeft === 0;

            return (
              <div key={s.id} className="p-3 border rounded-xl">
                <p className="font-medium">{s.name}</p>

                <p className="text-sm text-gray-500">
                  Instrument: {s.instrument}
                </p>

                <p className="text-sm text-gray-500">
                  Package: {s.package || "Silver"}
                </p>

                <p className="text-sm text-gray-500">
                  Lesson Days: {dayLabels}
                </p>

                <p className="text-sm">Lessons Left: {lessonsLeft}</p>

                {paymentDue && (
                  <p className="text-red-600 text-sm">⚠ Payment Due</p>
                )}

                <div className="flex gap-2 mt-2 flex-wrap">
                  <button
                    className="px-3 py-1 text-sm border rounded"
                    onClick={() => markAbsent(s)}
                  >
                    Mark Absent
                  </button>

                  <button
                    className="px-3 py-1 text-sm bg-green-600 text-white rounded"
                    onClick={() => renewPayment(s)}
                  >
                    Renew
                  </button>

                  <button
                    className="px-3 py-1 text-sm bg-red-500 text-white rounded"
                    onClick={() => deleteStudent(s.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
