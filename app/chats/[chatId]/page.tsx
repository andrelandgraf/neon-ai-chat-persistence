import Image from "next/image";
import Link from "next/link";
import { Chat } from "@/components/chat";
import { ModeToggle } from "@/components/theme-toggle";
import {
  getChatMessages,
  convertDbMessagesToUIMessages,
} from "@/lib/db/queries/chat";

interface PageProps {
  params: Promise<{ chatId: string }>;
}

export default async function ChatPage({ params }: PageProps) {
  const { chatId } = await params;

  // Load existing messages and convert to UI format
  const dbMessages = await getChatMessages(chatId);
  const history = convertDbMessagesToUIMessages(dbMessages);

  return (
    <div className="flex h-screen flex-col">
      <header className="flex items-center justify-between border-b px-4 py-3">
        <Link href="/" className="flex items-center gap-2">
          <Image
            className="h-6 w-auto dark:hidden"
            src="/logo.svg"
            alt="Neon"
            width={88}
            height={24}
          />
          <Image
            className="hidden h-6 w-auto dark:block"
            src="/logo-dark.svg"
            alt="Neon"
            width={88}
            height={24}
          />
        </Link>
        <ModeToggle />
      </header>
      <Chat chatId={chatId} initialMessages={history} />
    </div>
  );
}
