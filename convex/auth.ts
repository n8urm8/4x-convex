import { convexAuth } from "@convex-dev/auth/server";
import GitHub from "@auth/core/providers/github";
// import { ResendOTP } from "./otp/ResendOTP";
import { DevEmail } from "./otp/DevEmail";

export const { auth, signIn, signOut, store } = convexAuth({
  providers: [
    // Use DevEmail for development (no verification needed)
    // Switch to ResendOTP for production
    DevEmail,
    // ResendOTP,
    GitHub({
      authorization: {
        params: { scope: "user:email" },
      },
    }),
  ],
});
