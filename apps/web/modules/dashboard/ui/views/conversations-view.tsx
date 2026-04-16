import Image from "next/image";

export const ConversationsView = () => {
  return (
    <div className="flex h-full flex-1 flex-col gap-y-4 bg-muted">
      <div className="flex flex-1 items-center justify-center gap-x-2">
        <Image alt="Logo" height={64} width={64} src="/atlas_avatar.svg" />
        <p className="font-semibold text-lg">Atlas</p>
      </div>
    </div>
  );
};