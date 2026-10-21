interface ExamCardProps {
  subject: string;
  date: string;
  testType: string;
}

export default function ExamCard({ subject, date, testType }: ExamCardProps) {
  return (
    <div className="bg-amber-500 p-10 text-white w-full rounded-xl shadow-xs">
      <h3 className="uppercase text-xs font-bold text-amber-100 tracking-wider">Upcoming Exam</h3>
      <p className="text-2xl font-black mt-2 line-clamp-3" title={subject}>{subject}</p>
      <p className="text-lg font-medium">{date}</p>
      <p className="text-sm text-amber-100">{testType}</p>
    </div>
  );
}
