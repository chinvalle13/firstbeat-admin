// @ts-nocheck
'use client';

import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

// SUPABASE CONFIG (we will replace keys later)
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

function countLessonDays(startDate, lessonDay) {
  if (!startDate && startDate !== 0) return 0;

  const start = new Date(startDate);
  const today = new Date();

  let count = 0;
  const d = new Date(start);

  while (d <= today) {
    if (d.getDay() === Number(lessonDay)) count++;
    d.setDate(d.getDate() + 1);
  }

  return count;
}

export default function FirstBeatAdminPortal() {
  const [students, setStudents] = useState([]);

  const [newStudent, setNewStudent] = useState("");
  const [instrument, setInstrument] = useState("");
  const [lessonDay, setLessonDay] = useState(6);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState("");
  const [editingIndex, setEditingIndex] = useState(null);

  // LOAD STUDENTS FROM SUPABASE
  const loadStudents = async () => {
    const { data, error } = await supabase.from("students").select("*");

    if (error) {
      console.error("Load students error:", error);
      alert("Could not load students. Check Supabase permissions.");
      return;
    }

    if (data) setStudents(data);
  };

  useEffect(() => {
    loadStudents();
  }, []);

  const addStudent = async () => {
    if (!newStudent) return;

    const newEntry = {
      name: newStudent,
      instrument: instrument || "TBD",
      lessonDay: Number(lessonDay),
      paymentAmount: paymentAmount ? Number(paymentAmount) : null,
      paymentDate: paymentDate || null,
      absences: 0,
    };

    const { error } = await supabase.from("students").insert([newEntry]);

    if (error) {
      console.error("Insert error:", error);
      alert("Student was not saved. Check Supabase table permissions (RLS).");
      return;
    }

    setNewStudent("");
    setInstrument("");
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
      .update({
        absences: s.absences + 1,
        lastStatus: "Absent This Week",
      })
      .eq("id", s.id);

    loadStudents();
  };

  const undoAbsent = async (s) => {
    const newAbs = Math.max(0, s.absences - 1);

    await supabase
      .from("students")
      .update({
        absences: newAbs,
        lastStatus: newAbs === 0 ? "" : s.lastStatus,
      })
      .eq("id", s.id);

    loadStudents();
  };

  const renewPayment = async (s) => {
    const today = new Date().toISOString().split("T")[0];

    await supabase
      .from("students")
      .update({
        lessonsLeft: 4,
        paymentDate: today,
        lastStatus: "",
      })
      .eq("id", s.id);

    loadStudents();
  };

  const totalIncome = students.reduce(
    (sum, s) => sum + Number(s.paymentAmount || 0),
    0
  );

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
          <p className="text-xl font-bold">—</p>
        </div>

        <div className="p-4 border rounded-2xl shadow">
          <p className="text-sm">Students With Payment Due</p>
          <p className="text-xl font-bold">
            {students.filter((s) => s.lessonsLeft === 0).length}
          </p>
        </div>
      </div>

      <div className="border rounded-2xl shadow p-4">
        <h2 className="text-xl font-semibold mb-4">Add Student</h2>

        <div className="grid gap-2 md:grid-cols-4">
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
            value={lessonDay}
            onChange={(e) => setLessonDay(e.target.value)}
          >
            {days.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
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

        <button
          className="bg-black text-white px-4 py-2 rounded mt-3"
          onClick={addStudent}
        >
          Add
        </button>
      </div>

      <div className="border rounded-2xl shadow p-4">
        <h2 className="text-xl font-semibold mb-4">Student List</h2>

        <div className="space-y-4">
          {students.map((s) => {
            const dayName = days.find((d) => d.value == s.lessonDay)?.label;

            const usedLessons = Math.max(0, countLessonDays(s.paymentDate, s.lessonDay) - (s.absences || 0));

            const lessonsLeft = Math.max(0, 4 - usedLessons);

            const paymentDue = lessonsLeft === 0;

            return (
              <div key={s.id} className="p-3 border rounded-xl">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium">{s.name}</p>

                    <p className="text-sm text-gray-500">
                      Instrument: {s.instrument || "—"}
                    </p>

                    <p className="text-sm text-gray-500">
                      Lesson Day: {dayName}
                    </p>

                    <p className="text-sm">
                      Lessons Left: <b>{lessonsLeft}</b>
                    </p>

                    <p className="text-sm">
                      Absences: <b>{s.absences}</b>
                    </p>

                    <p className="text-sm">
                      Payment: ₱{s.paymentAmount || "—"}
                    </p>

                    <p className="text-sm">
                      Paid Date: {s.paymentDate || "—"}
                    </p>

                    {paymentDue && (
                      <p className="text-red-600 text-sm font-semibold">
                        ⚠ Payment Due
                      </p>
                    )}

                    <div className="flex gap-2 mt-2 flex-wrap">
                      <button
                        className="px-3 py-1 text-sm border rounded"
                        onClick={() => markAbsent(s)}
                      >
                        Mark Absent
                      </button>

                      {s.absences > 0 && (
                        <button
                          className="px-3 py-1 text-sm border rounded bg-yellow-100"
                          onClick={() => undoAbsent(s)}
                        >
                          Undo Absent
                        </button>
                      )}

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
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
