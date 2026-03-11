'use client'

import { useState, useEffect } from "react"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
process.env.NEXT_PUBLIC_SUPABASE_URL!,
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const days = [
{ label: "Sunday", value: 0 },
{ label: "Monday", value: 1 },
{ label: "Tuesday", value: 2 },
{ label: "Wednesday", value: 3 },
{ label: "Thursday", value: 4 },
{ label: "Friday", value: 5 },
{ label: "Saturday", value: 6 },
]

const MONTHLY_TUITION = 2500
const TEACHER_RATE = 250

export default function FirstBeatAdminPortal(){

const [students,setStudents] = useState<any[]>([])

const [newStudent,setNewStudent] = useState("")
const [instrument,setInstrument] = useState("")
const [teacher,setTeacher] = useState("")
const [lessonDay,setLessonDay] = useState(6)
const [paymentAmount,setPaymentAmount] = useState("")
const [paymentDate,setPaymentDate] = useState("")

async function loadStudents(){

```
const {data,error} = await supabase
  .from("students")
  .select("*")
  .order("name")

if(data) setStudents(data)
```

}

useEffect(()=>{
loadStudents()
},[])

async function addStudent(){

```
if(!newStudent) return

await supabase
  .from("students")
  .insert([{
    name:newStudent,
    instrument:instrument,
    teacher:teacher,
    lessonDay:lessonDay,
    paymentAmount:Number(paymentAmount),
    paymentDate:paymentDate,
    absences:0
  }])

setNewStudent("")
setInstrument("")
setTeacher("")
setPaymentAmount("")
setPaymentDate("")

loadStudents()
```

}

async function renewStudent(s:any){

```
const today = new Date().toISOString().split("T")[0]

await supabase
  .from("students")
  .update({
    paymentDate:today,
    paymentAmount:Number(s.paymentAmount)+MONTHLY_TUITION
  })
  .eq("id",s.id)

loadStudents()
```

}

const today = new Date().getDay()

const todaysStudents = students.filter(s => {

```
if(s.lessonDay !== null && s.lessonDay !== undefined){
  return s.lessonDay === today
}

if(Array.isArray(s.lessonDays)){
  return s.lessonDays.includes(today)
}

return false
```

})

const teacherTotals:any = {}

students.forEach(s=>{

```
if(!s.teacher) return

if(!teacherTotals[s.teacher]){
  teacherTotals[s.teacher] = 0
}

teacherTotals[s.teacher]+=TEACHER_RATE
```

})

return(

```
<div className="p-6 grid gap-6">

  <h1 className="text-3xl font-bold">
    First Beat Music Studio – Admin Portal
  </h1>

  {/* TODAY LESSONS */}

  <div className="border rounded-xl p-4">

    <h2 className="font-semibold mb-2">
      Today's Lessons
    </h2>

    {todaysStudents.length === 0 && (
      <p>No lessons today</p>
    )}

    {todaysStudents.map(s=>(
      <div key={s.id}>
        {s.name} — {s.instrument} — {s.teacher}
      </div>
    ))}

  </div>

  {/* ADD STUDENT */}

  <div className="border rounded-xl p-4">

    <h2 className="font-semibold mb-2">
      Add Student
    </h2>

    <input
      placeholder="Student Name"
      value={newStudent}
      onChange={e=>setNewStudent(e.target.value)}
    />

    <input
      placeholder="Instrument"
      value={instrument}
      onChange={e=>setInstrument(e.target.value)}
    />

    <input
      placeholder="Teacher"
      value={teacher}
      onChange={e=>setTeacher(e.target.value)}
    />

    <select
      value={lessonDay}
      onChange={e=>setLessonDay(Number(e.target.value))}
    >

      {days.map(d=>(
        <option
          key={d.value}
          value={d.value}
        >
          {d.label}
        </option>
      ))}

    </select>

    <input
      placeholder="Payment Amount"
      value={paymentAmount}
      onChange={e=>setPaymentAmount(e.target.value)}
    />

    <input
      type="date"
      value={paymentDate}
      onChange={e=>setPaymentDate(e.target.value)}
    />

    <button
      onClick={addStudent}
    >
      Add
    </button>

  </div>

  {/* STUDENTS LIST */}

  <div className="border rounded-xl p-4">

    <h2 className="font-semibold mb-2">
      Students
    </h2>

    {students.map(s=>(
      <div key={s.id} style={{marginBottom:10}}>

        <strong>{s.name}</strong> — {s.instrument}

        <button
          style={{marginLeft:10}}
          onClick={()=>renewStudent(s)}
        >
          Renew
        </button>

      </div>
    ))}

  </div>

  {/* TEACHER PAYROLL */}

  <div className="border rounded-xl p-4">

    <h2 className="font-semibold mb-2">
      Teacher Payroll
    </h2>

    {Object.entries(teacherTotals).map(([t,a])=>(
      <div key={t}>
        {t} — ₱{a as number}
      </div>
    ))}

  </div>

</div>
```

)

}
