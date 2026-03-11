'use client'

import { useState, useEffect } from "react"
import { createClient } from "@supabase/supabase-js"

// SUPABASE
const supabase = createClient(
process.env.NEXT_PUBLIC_SUPABASE_URL!,
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// DAYS
const days = [
{ label: "Sunday", value: 0 },
{ label: "Monday", value: 1 },
{ label: "Tuesday", value: 2 },
{ label: "Wednesday", value: 3 },
{ label: "Thursday", value: 4 },
{ label: "Friday", value: 5 },
{ label: "Saturday", value: 6 },
]

// PACKAGES
const packages: any = {
Silver: 4,
Gold: 8,
Platinum: 12,
}

// CONSTANTS
const MONTHLY_TUITION = 2500
const TEACHER_PER_LESSON = 250

function countLessonDaysMultiple(startDate: any, lessonDays: number[]) {

if (!startDate) return 0

const start = new Date(startDate)
const today = new Date()

let count = 0
const d = new Date(start)

while (d <= today) {
if (lessonDays.includes(d.getDay())) count++
d.setDate(d.getDate() + 1)
}

return count
}

export default function FirstBeatAdminPortal() {

const [students, setStudents] = useState<any[]>([])

const [newStudent, setNewStudent] = useState("")
const [instrument, setInstrument] = useState("")
const [teacher, setTeacher] = useState("")
const [pkg, setPkg] = useState("Silver")
const [lessonDays, setLessonDays] = useState<number[]>([6])
const [paymentAmount, setPaymentAmount] = useState("")
const [paymentDate, setPaymentDate] = useState("")

const toggleDay = (day: number) => {

```
if (lessonDays.includes(day)) {
  setLessonDays(lessonDays.filter((d) => d !== day))
} else {
  setLessonDays([...lessonDays, day])
}
```

}

async function loadStudents() {

```
const { data } = await supabase.from("students").select("*")

if (data) setStudents(data)
```

}

useEffect(() => {
loadStudents()
}, [])

async function addStudent() {

```
if (!newStudent) return

const newEntry = {
  name: newStudent,
  instrument: instrument || "TBD",
  teacher: teacher || "",
  package: pkg,
  lessonDays: lessonDays,
  paymentAmount: paymentAmount ? Number(paymentAmount) : 0,
  paymentDate: paymentDate || null,
  absences: 0,
}

await supabase.from("students").insert([newEntry])

setNewStudent("")
setInstrument("")
setTeacher("")
setPaymentAmount("")
setPaymentDate("")
setLessonDays([6])

loadStudents()
```

}

async function deleteStudent(id: number) {

```
await supabase.from("students").delete().eq("id", id)

loadStudents()
```

}

async function markAbsent(s: any) {

```
await supabase
  .from("students")
  .update({ absences: (s.absences || 0) + 1 })
  .eq("id", s.id)

loadStudents()
```

}

async function renewPayment(s: any) {

```
const today = new Date().toISOString().split("T")[0]

const newAmount = Number(s.paymentAmount || 0) + MONTHLY_TUITION

await supabase
  .from("students")
  .update({
    paymentDate: today,
    paymentAmount: newAmount,
    absences: 0,
  })
  .eq("id", s.id)

loadStudents()
```

}

const totalIncome = students.reduce(
(sum, s) => sum + Number(s.paymentAmount || 0),
0
)

const totalLessonsUsed = students.reduce((sum, s) => {

```
const studentDays = s.lessonDays || [s.lessonDay]

const usedLessons = Math.max(
  0,
  countLessonDaysMultiple(s.paymentDate, studentDays) -
    (s.absences || 0)
)

return sum + usedLessons
```

}, 0)

const totalTeacherPay = totalLessonsUsed * TEACHER_PER_LESSON

const studioNetIncome = totalIncome - totalTeacherPay

const teacherTotals: any = {}

students.forEach((s) => {

```
const studentDays = s.lessonDays || [s.lessonDay]

const usedLessons = Math.max(
  0,
  countLessonDaysMultiple(s.paymentDate, studentDays) -
    (s.absences || 0)
)

const pay = usedLessons * TEACHER_PER_LESSON

if (!teacherTotals[s.teacher]) teacherTotals[s.teacher] = 0

teacherTotals[s.teacher] += pay
```

})

const today = new Date().getDay()

const todaysStudents = students.filter((s) => {

```
const studentDays = s.lessonDays || [s.lessonDay]

return studentDays.includes(today)
```

})

const paymentDueCount = students.filter((s) => {

```
const studentDays = s.lessonDays || [s.lessonDay]

const usedLessons = Math.max(
  0,
  countLessonDaysMultiple(s.paymentDate, studentDays) -
    (s.absences || 0)
)

const limit = packages[s.package || "Silver"]

const lessonsLeft = Math.max(0, limit - usedLessons)

return lessonsLeft === 0
```

}).length

return (

```
<div className="p-6 grid gap-6">

  <h1 className="text-3xl font-bold">
    First Beat Music Studio – Admin Portal
  </h1>

  <div className="grid grid-cols-2 md:grid-cols-6 gap-4">

    <div className="p-4 border rounded-xl">
      Total Students
      <div className="text-xl font-bold">{students.length}</div>
    </div>

    <div className="p-4 border rounded-xl">
      Total Tuition
      <div className="text-xl font-bold">₱{totalIncome}</div>
    </div>

    <div className="p-4 border rounded-xl">
      Teacher Pay
      <div className="text-xl font-bold">₱{totalTeacherPay}</div>
    </div>

    <div className="p-4 border rounded-xl">
      Studio Net
      <div className="text-xl font-bold">₱{studioNetIncome}</div>
    </div>

    <div className="p-4 border rounded-xl">
      Today's Lessons
      <div className="text-xl font-bold">{todaysStudents.length}</div>
    </div>

    <div className="p-4 border rounded-xl">
      Payment Due
      <div className="text-xl font-bold">{paymentDueCount}</div>
    </div>

  </div>

  <div className="border rounded-xl p-4">
    <h2 className="font-semibold mb-2">Today's Lessons</h2>

    {todaysStudents.map((s) => (
      <div key={s.id}>
        {s.name} — {s.instrument} — {s.teacher}
      </div>
    ))}
  </div>

  <div className="border rounded-xl p-4">

    <h2 className="font-semibold mb-2">Add Student</h2>

    <input
      placeholder="Student Name"
      value={newStudent}
      onChange={(e) => setNewStudent(e.target.value)}
    />

    <input
      placeholder="Instrument"
      value={instrument}
      onChange={(e) => setInstrument(e.target.value)}
    />

    <input
      placeholder="Teacher"
      value={teacher}
      onChange={(e) => setTeacher(e.target.value)}
    />

    <select value={pkg} onChange={(e) => setPkg(e.target.value)}>
      <option>Silver</option>
      <option>Gold</option>
      <option>Platinum</option>
    </select>

    <input
      placeholder="Payment Amount"
      value={paymentAmount}
      onChange={(e) => setPaymentAmount(e.target.value)}
    />

    <input
      type="date"
      value={paymentDate}
      onChange={(e) => setPaymentDate(e.target.value)}
    />

    <div className="flex gap-2 mt-2">

      {days.map((d) => (

        <button
          key={d.value}
          onClick={() => toggleDay(d.value)}
        >
          {d.label}
        </button>

      ))}

    </div>

    <button onClick={addStudent}>
      Add
    </button>

  </div>

  <div className="border rounded-xl p-4">

    <h2 className="font-semibold mb-2">Teacher Payroll</h2>

    {Object.entries(teacherTotals).map(([t, amount]) => (

      <div key={t}>
        {t} — ₱{amount as number}
      </div>

    ))}

  </div>

</div>
```

)

}
