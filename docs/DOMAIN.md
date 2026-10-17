# When your domain arrives

The app has no web address written into the code, so nothing needs rebuilding for the domain. It uses whatever address it is opened on.

1. **Cloudflare Pages**: your project, Custom domains, Set up a custom domain, enter it, follow the prompts (if the domain is bought at Cloudflare it is one click; otherwise change the domain's name servers to the two Cloudflare gives you).
2. **Supabase**: Authentication, URL Configuration. Site URL = `https://yourdomain`. Add `https://yourdomain/**` to Redirect URLs. Keep the localhost entry for testing.
3. **Google Cloud**: Google Auth Platform, Clients, your client. Authorised JavaScript origins = `https://yourdomain`. (The redirect URI stays the Supabase one.) Branding: homepage `https://yourdomain`, privacy `https://yourdomain/privacy`, terms `https://yourdomain/terms`, authorised domain `yourdomain`. Then Audience, Publish app.
4. **Resend**: add the domain, copy the DNS records it shows into Cloudflare DNS, then send email codes and warnings from `hello@yourdomain`.
5. **Razorpay webhook** (when payments go live): URL is `https://<your-project>.supabase.co/functions/v1/razorpay-webhook`.

Tell Claude the domain and it will update the manifest, legal pages and this checklist.
