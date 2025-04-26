import React from "react";
import { motion, AnimatePresence } from "framer-motion";

interface PageLayoutProps {
  children: React.ReactNode;
  locationKey?: string; // optional key to trigger animation on route change
}

export const PageLayout: React.FC<PageLayoutProps> = ({ children, locationKey }) => {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={locationKey || "page"}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.3 }}
        style={{ minHeight: "100vh" }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};
