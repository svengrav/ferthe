import { ButtonLink } from "./ButtonLink.tsx";

export const LinkedInButton = () => {
  return (
    <ButtonLink
      className="bg-blue-600! text-white rounded-4xl!"
      to="https://www.linkedin.com/in/svengrav/"
      target="_blank"
    >
      Linkedin
    </ButtonLink>
  );
};
