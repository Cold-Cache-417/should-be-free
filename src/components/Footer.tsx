import { motion } from "motion/react";

export function Footer() {
  return (
    <motion.footer
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut", delay: 0.5 }}
      className="mt-9 w-full max-w-[400px] border-t border-white/[0.06] pt-5 text-center"
    >
      <p className="text-[12px] font-medium tracking-wide text-zinc-500">
        Made by @lxqmxn_24
      </p>
      <p className="mt-1 text-[12px] text-zinc-600">DM me if you like this.</p>
    </motion.footer>
  );
}
