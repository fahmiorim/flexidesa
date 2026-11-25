import type { Metadata } from "next";

import SejarahPage from "../../sejarah/page";

export const metadata: Metadata = {
  title: "Sejarah Desa",
  description: "Sejarah berdirinya desa dan perkembangannya.",
};
export const dynamic = "force-dynamic";

export default SejarahPage;
