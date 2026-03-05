import logo from "@/assets/logo.png";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  showText?: boolean;
}

const Logo = ({ size = "md", className = "", showText = true }: LogoProps) => {
  const sizes = {
    sm: "h-8",
    md: "h-10",
    lg: "h-12 md:h-14",
  };

  return (
    <img
      src={logo}
      alt="Excellent Global Management Solutions"
      className={`${sizes[size]} w-auto object-contain ${className}`}
    />
  );
};

export default Logo;
