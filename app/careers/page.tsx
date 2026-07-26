import { Metadata } from "next";
import CareersClient from "./CareersClient";

export const metadata: Metadata = {
  title: "Careers at YMUTE | Join Our Team",
  description: "Build the future of live event broadcasting and audio technology with the YMUTE engineering, product, and media teams.",
};

export default function CareersPage() {
  return <CareersClient />;
}
