interface ExamCardProps {
  subject: string;
  date: string;
  testType: string;
}

export default function ExamCard({ subject, date, testType}: ExamCardProps) {
  return (
    <div className="bg-amber-500  p-10 text-white w-full">
      <h3 className="uppercase text-xs font-bold opacity-70">Upcoming Exam</h3>
      <p className="text-2xl font-black mt-2 line-clamp-3" title={subject}>{subject}</p>
      <p className="text-lg">{date}</p>
      <p className="text-sm ">{testType}</p>
    </div>
  );
}
