"use client";

import Image from "next/image";
import { useState } from "react";

interface Props {
  src: string;
}

export default function NewsThumbnail({ src }: Props) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return null;
  }

  return (
    <Image
      src={src}
      alt=""
      width={64}
      height={48}
      unoptimized
      onError={() => setFailed(true)}
      className="h-12 w-16 shrink-0 rounded-lg object-cover opacity-80"
    />
  );
}