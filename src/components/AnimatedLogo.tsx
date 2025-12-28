import { motion } from "framer-motion";

interface AnimatedLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

const AnimatedLogo = ({ className = "", size = "md" }: AnimatedLogoProps) => {
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-12 h-12",
    lg: "w-16 h-16",
  };

  return (
    <motion.div
      className={`${sizeClasses[size]} ${className}`}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <motion.svg
        viewBox="0 0 100 100"
        className="w-full h-full"
        initial="hidden"
        animate="visible"
      >
        {/* Base circle with glow */}
        <motion.circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke="hsl(var(--gold))"
          strokeWidth="2"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 1.5, ease: "easeInOut" }}
        />
        
        {/* Cross - vertical */}
        <motion.line
          x1="50"
          y1="20"
          x2="50"
          y2="80"
          stroke="hsl(var(--burgundy))"
          strokeWidth="4"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.8, delay: 0.5, ease: "easeOut" }}
        />
        
        {/* Cross - horizontal */}
        <motion.line
          x1="30"
          y1="40"
          x2="70"
          y2="40"
          stroke="hsl(var(--burgundy))"
          strokeWidth="4"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.6, delay: 0.8, ease: "easeOut" }}
        />
        
        {/* Decorative dots */}
        {[0, 90, 180, 270].map((angle, i) => (
          <motion.circle
            key={angle}
            cx={50 + 38 * Math.cos((angle * Math.PI) / 180)}
            cy={50 + 38 * Math.sin((angle * Math.PI) / 180)}
            r="3"
            fill="hsl(var(--gold))"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3, delay: 1.2 + i * 0.1 }}
          />
        ))}
      </motion.svg>
    </motion.div>
  );
};

export default AnimatedLogo;
