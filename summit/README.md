# AI Summit 2026: breakout sign-ups

Students pick breakouts on a Google Form. Organisers assign them in a Google Sheet. The website's `/summit` page shows how full each breakout is, and the Sheet sends each student a confirmation email and, later, their pre-summit topic.

The AI Summit is on **Wednesday 16 December 2026** at Vidyashilp Academy, Bengaluru. Breakouts run in one time slot, **12:45–2:45 pm** (Settings → *Time slots*; add more there if a breakout ever runs twice).

```
Student ──▶ Google Form ──▶ Sheet "Responses" tab (organisers only)
                                │  organisers fill "Assigned breakout"
                                ├──▶ AI Summit menu ──▶ confirmation + topic emails
                                └──▶ Apps Script web app ──▶ JSON: seat counts only ──▶ website /summit
```

## What's where

| Path | What it is |
| --- | --- |
| `summit/apps-script/*.gs`, `appsscript.json` | The Apps Script code you paste into the Sheet. Each file starts with a comment explaining it. |
| `summit/TESTING.md` | Checklist to run before going live. |
| `summit/run-self-tests.cjs` | Runs the script's self-tests on a computer: `node summit/run-self-tests.cjs`. |
| `src/pages/SummitPage.tsx` | The `/summit` page. |
| `src/components/BreakoutChooser.tsx` | The "Choose your breakout" section. |
| `src/lib/breakouts.ts` | Fetches and caches seat counts, with the fallback. |

Nothing in this repo contains a real student, a deployment URL or a secret. Test data uses made-up names and `example.test` addresses.

---

## One-time setup

### 1. Create the Sheet

1. Sign in to the **school Google Workspace account** that should send the emails. Emails go from whoever clicks the menu, so use this account for the steps below.
2. Create a new Google Sheet, for example *AI Summit 2026 – Breakouts (organisers only)*.
3. Click **Share**. Keep **General access** set to **Restricted**, and add only the organisers, as Editors. Never set it to "Anyone with the link".

### 2. Add the script

1. In the Sheet, open **Extensions → Apps Script**.
2. Open **Project Settings** (the gear icon) and tick **Show "appsscript.json" manifest file in editor**.
3. Back in **Editor**, replace the contents of `appsscript.json` with [`apps-script/appsscript.json`](apps-script/appsscript.json).
4. Rename `Code.gs` to `Config` and paste in [`Config.gs`](apps-script/Config.gs).
5. For each of the other files, click **+ → Script**, type the name without `.gs`, and paste the file's contents:
   `Logic`, `Sheets`, `Setup`, `Capacity`, `Api`, `Email`, `Tests`.
6. Click **Save** (the disk icon).

### 3. Run setup

1. Reload the Sheet. An **AI Summit** menu appears after a few seconds.
2. Click **AI Summit → Run setup (first time only)**.
3. Google asks you to allow the script to manage your Sheets and Forms and send email as you. Allow it. (If you see "Google hasn't verified this app", click **Advanced → Go to … (unsafe)**. It's your own script.)
4. Setup creates:
   - the **Google Form**, with name, grade, school email, a 1st/2nd/3rd-choice grid and a consent line
   - these tabs: **Settings**, **Breakouts**, **Templates**, **Topics**, **Responses** (linked to the form), and **Capacity** (written later by the capacity check)
5. On the **Settings** tab, check **Form requires school sign-in**:
   - **Yes**: students sign in with their school account. Their email is collected automatically, and each student gets one response, which they can edit.
   - **No**: the account isn't a Workspace account, so students type their email. Duplicate submissions are caught in the Sheet instead.
6. Open the **Student form link** from Settings and look at the form.
7. Click **AI Summit → Run self-tests (fake data, no emails)**. All tests should pass.

Now fill in the **Breakouts** tab (descriptions, rooms, any changes) and click **AI Summit → Refresh form choices and dropdowns**.

### 4. Deploy the web app (the seat-count endpoint)

1. In the Apps Script editor, click **Deploy → New deployment**.
2. Click the gear next to **Select type** and choose **Web app**.
3. Set **Execute as** to **Me** and **Who has access** to **Anyone**. Click **Deploy**.
4. Copy the **Web app URL**. It ends in `/exec`.
5. Open the URL in a private browser window. You should see JSON like `{"ok":true,…,"breakouts":[…]}` with names and counts only.

If **Anyone** isn't offered, your school's Workspace admin has blocked public web apps. Ask them to allow it for this one script. The endpoint shows only seat counts, but the website can't read it without public access.

**After changing the script later:** use **Deploy → Manage deployments → ✏️ Edit → Version: New version → Deploy**. This keeps the same URL. ("New deployment" would make a new URL.)

### 5. Connect the website

The site reads two settings at build time. Neither is a secret (the page shows them), but they stay out of git so nothing is published before you choose.

1. In Vercel, open the project, then **Settings → Environment Variables**, and add:

   | Name | Value |
   | --- | --- |
   | `VITE_BREAKOUTS_ENDPOINT` | the `/exec` URL from step 4 |
   | `VITE_BREAKOUT_FORM_URL` | **Student form link** from the Settings tab |

2. Redeploy, because the values are baked in at build time.
3. For local development, put the same lines in `.env.local`, which git ignores. See `.env.example`.

Until these are set, the page shows "The form opens soon" and "Availability will update soon".

### 6. Test, then clear the test data

Work through [TESTING.md](TESTING.md) with made-up students. Then, before giving students the link:

1. In the **Form**: **Responses → ⋮ → Delete all responses**.
2. In the **Sheet**: delete the test rows on the **Responses** tab (whole rows, not just the values).
3. Run **AI Summit → Check capacity and duplicates**. Every count should be 0.

---

## Weekly organiser routine

1. **Check.** Click **AI Summit → Check capacity and duplicates**. It:
   - marks older duplicate responses ("Older response: row N counts")
   - turns problem cells red
   - rewrites the **Capacity** tab
   - lists anything that would stop an email
2. **Assign.** On the **Responses** tab, use each student's ranking to pick a breakout from the dropdown in an **Assigned breakout** column:
   - With one time slot (12:45–2:45 pm), fill the single **Assigned breakout (slot 1 …)** column.
   - If you add a second time slot later: with 1 breakout per student, fill **one** of the slot columns.
   - With 2 breakouts per student, fill **both** slot columns, with a different breakout in each.
   - A cell turns red if the breakout is over capacity, isn't a breakout, doesn't run in that slot, or is on an older duplicate response. A pop-up names any breakout that goes over capacity.
   - The website catches up within about 6 minutes: up to 1 minute of caching in the script, plus 5 in the browser.
3. **Send confirmations.** Click **AI Summit → Send confirmation emails to newly assigned students**. It tells you how many will go and how many emails the account has left today. Click **Yes**.
   - Afterwards, check the **Confirmation email** column. Anyone held back has a "Not sent: …" reason, such as over capacity, an unknown breakout, or no valid email.
   - Each student gets **one** confirmation. Running it again only emails students who are new or whose assignment changed.
4. **Changes after an email went out.** Just change the cell and run step 3 again. The student gets one **"Updated: your breakout"** email. If you clear a student's assignment, no email goes out. Their status says to tell the student yourself.
5. **Topic emails** (once you have the topics):
   1. On the **Topics** tab, write the beginner, intermediate and advanced topic for each breakout.
   2. On **Responses**, set each student's **Level**.
   3. Click **AI Summit → Send me a test of each email** and read the result.
   4. Click **AI Summit → Send assignment-topic emails**.
   A student only gets a topic email after their *current* assignment has been confirmed, and only once. If their breakout or level changes afterwards, the next run re-sends it once.

## Changing things without code

| To… | Do this |
| --- | --- |
| Add a breakout | Add a row on **Breakouts**, then **Refresh form choices and dropdowns**. |
| Rename a breakout | Change its **name** but keep its **id**, then **Refresh…**. Existing assignments are renamed for you. Students who were already emailed are *not* emailed again. |
| Hide a breakout | Untick **listed**, then **Refresh…**. It disappears from the website and the form. |
| Change seats | Edit **capacity** (seats per run). Blank uses Settings → *Default capacity per run* (31). |
| Mark as tentative | Set **status** to `tentative`. The website shows a "Tentative" tag. |
| Run a breakout in one slot only | Set **runs** to that slot's time, exactly as written in Settings → *Time slots*, or to `1` or `2`. |
| Give each student 2 breakouts | Set Settings → *Breakouts per student* to `2`, then **Refresh…**. |
| Change grades or the date | Edit **Settings**, then **Refresh…**. |
| Edit an email | Edit the **Templates** tab. See the placeholders below. |

A breakout with no description shows **"Topic to be announced"** on the website.

### Email placeholders

| Placeholder | Becomes |
| --- | --- |
| `{name}`, `{first_name}`, `{grade}` | The student's details |
| `{breakout}` | Breakout name(s), e.g. "AI in Finance and AI Ethics" |
| `{time}`, `{room}` | Time(s) and room(s). Room is blank if not filled in. |
| `{schedule}` | One line per breakout: "• AI in Finance: 12:45–2:45 pm, Room 204" (the room only if filled in) |
| `{date}` | Settings → *Summit date* |
| `{level}` | Beginner, Intermediate or Advanced (topic email) |
| `{topic}`, `{topics}` | The topic text, or one line per breakout with its topic (topic email) |

Any other `{word}` in a template stops sending, so a typo never reaches students.

## Email quota

- **Google Workspace accounts, including school accounts: 1,500 recipients a day.** Personal Gmail accounts get 100 a day.
- **AI Summit → Show remaining email quota** shows the live number for your account.
- About 250 students means about 250 confirmations plus about 250 topic emails, which fits within one day on a Workspace account.
- Sending stops 5 short of the limit. Anyone left over is marked "Waiting: daily email limit reached" and goes the next time you run it.
- Only one organiser can send at a time. A second click waits or tells you to try again.

## Privacy (the school's rules)

- The form collects only name, grade, school email, the three choices and a consent tick. Its consent line says the data is used only to run the summit.
- The form's response summary is turned off, so students can't see each other's answers.
- The Sheet is shared with organisers only.
- The endpoint returns only breakout id, name, description, status and, for each time slot: time, capacity, seats taken, seats left and full. It never includes student names, emails, grades or rooms. A self-test checks this.
- No student data is in this repo. Test data is made up.
- Consider deleting the Responses after the summit, if the school's data-retention rules allow.

## Troubleshooting

- **The website says "Availability will update soon".** Open the `/exec` URL.
  - `{"ok":false}` means the script hit an error. Check **Apps Script → Executions**. Usually a tab was renamed, or setup hasn't run.
  - A Google sign-in page means access isn't set to **Anyone** (step 4).
  - Also check `VITE_BREAKOUTS_ENDPOINT` in Vercel and redeploy.
- **No AI Summit menu.** Reload the Sheet and wait a few seconds.
- **Dashes or bullets look like `‚Äì` after pasting the code.** The clipboard changed the text's encoding. Copy the files again from a UTF-8 editor such as VS Code or GitHub's "Raw" view, and paste over the code.
- **Setup keeps asking for permission.** Run it from a normal Chrome or Safari window, signed in to the school account only. Permission windows don't always complete inside embedded browsers, or when several Google accounts are signed in. If two setup runs ever overlap and create a second form, unlink the extra "Form Responses 2" tab (right-click it → **Unlink form**), delete that tab, and trash the extra form in Drive. The real form is the one on the Settings tab. The current `Setup.gs` locks setup so this can't happen.
- **"Fix these first" when sending.** The message names the row on Settings or Breakouts to fix, e.g. a time in **runs** that doesn't match Settings.
- **A cell is red.** Run **Check capacity and duplicates**; the pop-up lists each problem by row.
