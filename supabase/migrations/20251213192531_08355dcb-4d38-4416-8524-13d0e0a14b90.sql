-- Create index for efficient ordering
CREATE INDEX IF NOT EXISTS idx_editorial_queue_ordering 
ON public.editorial_queue (last_published_at ASC NULLS FIRST, initial_sequence ASC);

-- Pre-populate all region×topic combinations with round-robin sequencing
WITH all_combinations AS (
  SELECT 
    r.id as region_id,
    r.name as region_name,
    t.id as topic_id,
    t.name as topic_name,
    ROW_NUMBER() OVER (ORDER BY r.name, t.name) as combo_num
  FROM public.regions r
  CROSS JOIN public.topics t
),
round_robin AS (
  SELECT 
    region_id,
    topic_id,
    region_name,
    topic_name,
    combo_num,
    ((combo_num - 1) % 6) * 1000 + ((combo_num - 1) / 6) as rr_order
  FROM all_combinations
)
INSERT INTO public.editorial_queue (region_id, topic_id, priority_score, gap_reason, status, initial_sequence)
SELECT 
  region_id,
  topic_id,
  100 as priority_score,
  'Circular queue item' as gap_reason,
  'pending' as status,
  ROW_NUMBER() OVER (ORDER BY rr_order) as initial_sequence
FROM round_robin
WHERE NOT EXISTS (
  SELECT 1 FROM public.editorial_queue eq 
  WHERE eq.region_id = round_robin.region_id 
    AND eq.topic_id = round_robin.topic_id
)
ORDER BY rr_order;

-- Update any existing rows without initial_sequence
UPDATE public.editorial_queue eq
SET initial_sequence = sub.seq
FROM (
  SELECT 
    eq2.id,
    ROW_NUMBER() OVER (
      ORDER BY eq2.last_published_at ASC NULLS FIRST, r.name, t.name
    ) as seq
  FROM public.editorial_queue eq2
  JOIN public.regions r ON r.id = eq2.region_id
  JOIN public.topics t ON t.id = eq2.topic_id
  WHERE eq2.initial_sequence IS NULL
) sub
WHERE eq.id = sub.id;