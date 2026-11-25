import type { Metadata } from "next";

import StatistikPage from "../../statistik/page";

export const metadata: Metadata = {
  title: "Data Statistik Desa",
  description: "Data dan statistik kependudukan serta pembangunan desa.",
};
export const dynamic = "force-dynamic";

export default StatistikPage;
