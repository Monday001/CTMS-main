import Typography from "@mui/material/Typography";
import Link from "next/link";
import Container from "@mui/material/Container";

function Copyright(props: any) {
  return (
    <Typography
      variant="body2"
      color="text.secondary"
      align="center"
      {...props}
    >
      {"Copyright © "}
      <Link color="inherit" href="/">
        CTMS
      </Link>{" "}
      {new Date().getFullYear()}
      {"."}
    </Typography>
  );
}

const Footer = () => <Copyright sx={{ pt: 4 }}  className="bg-white" />;

export default Footer ;
