# AI Summit breakouts: testing checklist

Run this before students get the link. Use **made-up students only**, e.g. "Test Alpha" at `alpha@example.test`, or organisers' own school accounts for the email checks. Clear the test data afterwards (README step 6).

## Automated

- [ ] **Self-tests in the Sheet:** **AI Summit → Run self-tests (fake data, no emails)**. All pass.
- [ ] **Same tests on a computer:** `node summit/run-self-tests.cjs`. All pass.
- [ ] **Website build:** `npm run build` succeeds.

The self-tests cover: full breakouts, duplicate submissions, assignments changing after an email, renaming, wrong slots, wrong counts, topic-email rules, template typos, and that the endpoint never contains student data.

## Manual

Tip: to test a full breakout quickly, set one breakout's **capacity** to `2` on the Breakouts tab. Put it back to 31 afterwards.

### 1. A full breakout

- [ ] Submit the form 3 times as 3 different test students. Assign all 3 to the same breakout in slot 1.
- [ ] The third cell turns red. A pop-up says "Over capacity", naming the breakout and slot.
- [ ] **Send confirmation emails**: all 3 are "Not sent: … is over capacity (3/2)". Nothing is sent.
- [ ] Move one student to another breakout. The red clears. Send: 2 + 1 emails go.
- [ ] Open the `/exec` URL: that breakout's slot 1 shows `"taken":2,"left":0,"full":true`. It never shows 3.
- [ ] On `/summit` (after up to 6 minutes, or in a private window): that time slot says **Full** with a full bar. If every slot of the breakout is full, the card has a **Full** tag and a dashed border.

### 2. A student submitting twice

If the form is restricted to school sign-in:

- [ ] Opening the form again offers **Edit your response**, not a second response. Editing updates the same row.

With the form open to anyone (the default):

- [ ] Submit twice with the same email address, using different capitals.
- [ ] **Check capacity and duplicates**: the older row says "Older response: row N counts". Only the newer row counts towards seats.
- [ ] Assign the **older** row: the cell turns red. Sending says "older duplicate response: assign row N instead".
- [ ] Assign the newer row and send. One email arrives.
- [ ] Assign and email a student, then submit again as them. Put the **same** breakout on the new row and send again. **No** second email arrives; the status says "Already emailed from an earlier response".

### 3. An assignment changing after the email was sent

- [ ] Assign a test student, then send. The **Confirmation email** column says "Sent …" and **Confirmation sent for** says e.g. `slot1=finance`.
- [ ] Run **Send confirmation emails** again: "Nothing to send". No duplicate.
- [ ] Change the student's breakout, or move them to the other time slot, then send. **One** "Updated: your AI Summit 2026 breakout" email arrives. The status says "Update sent …".
- [ ] Send again: nothing.
- [ ] Clear the student's assignment, then send. No email. The status says "Not sent: assignment cleared after the email was sent: tell the student".
- [ ] Topic emails: give the student a **Level** and a topic on the Topics tab, then send topic emails (one arrives). Change their breakout: topic emails say "send the confirmation email first". Send the confirmation update, then topic emails again: one re-sent topic email arrives.

### 4. The endpoint being down

- [ ] In a local build, set `VITE_BREAKOUTS_ENDPOINT` to a wrong URL in `.env.local`, then clear site data (or use a private window). `/summit` shows "Availability will update soon. You can still rank your breakouts on the form." The **Rank your breakouts** button still works. No error appears on the page.
- [ ] Load `/summit` once with the right URL, then break the URL and load again more than 5 minutes later. The page shows the earlier seat counts, labelled "Availability will update soon. Showing seats as of …". After an hour it falls back to the message alone.
- [ ] Rename the **Breakouts** tab for a minute, then open the `/exec` URL: it returns `{"ok":false}` and nothing else. Rename it back.
- [ ] With neither setting configured, `/summit` shows "The form opens soon" and the fallback message.

### Also check

- [ ] **Emails:** **Send me a test of each email** delivers 3 emails to you. They come from the school account, show the sender name, and contain the correct times. The room appears only when filled in.
- [ ] **Template typo:** put `{breakuot}` in a template, then send. Sending refuses and names the typo. Fix it.
- [ ] **Two breakouts per student:** set Settings → *Breakouts per student* to `2`. A student with only slot 1 filled is held back with "needs 2 breakouts". With both slots filled, they get one email listing both breakouts and times. Set it back if needed.
- [ ] **Hide and rename:** untick **listed** for a breakout, then **Refresh…**. It disappears from the form and from the `/exec` JSON. Rename another breakout (same id), then **Refresh…**. Assignment cells update, and nobody is re-emailed.
- [ ] **Privacy:** the `/exec` JSON contains no names, emails, grades or rooms. The form's response summary is not visible to students. The Sheet's sharing is **Restricted**.
- [ ] **Website:** `/summit` works on a phone (no sideways scrolling). Keyboard Tab reaches "Skip to breakouts", the nav, the form button, and the links. Every focused item has a visible outline. Seat information is in text, not only in the bars.
