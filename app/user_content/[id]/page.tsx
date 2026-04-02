import { after } from "next/server";
import { incrementUserReviewViewCount } from "@/lib/user-reviews";
import { UserContentPage } from "@/components/user-content-page";

export default async function MainUserContentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  after(() => { void incrementUserReviewViewCount(id); });

  return <UserContentPage id={id} />;
}
