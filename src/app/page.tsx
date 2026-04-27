import { redirect } from 'next/navigation';

export default function RootPage() {
  // Use this if (astrolabe) contains a folder like 'dashboard' 
  // and you want '/' to send people there.
  redirect('/dashboard'); 
}