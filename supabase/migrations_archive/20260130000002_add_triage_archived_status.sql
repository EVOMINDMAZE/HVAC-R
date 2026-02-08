-- Add 'archived' status to triage_submissions
ALTER TABLE public.triage_submissions
DROP CONSTRAINT IF EXISTS triage_submissions_status_check;

ALTER TABLE public.triage_submissions
ADD CONSTRAINT triage_submissions_status_check 
CHECK (status IN ('new', 'analyzed', 'converted', 'archived'));

COMMENT ON COLUMN public.triage_submissions.status IS 'Status of the lead: new, analyzed (by AI), converted (to job), or archived (ignored/completed).';
