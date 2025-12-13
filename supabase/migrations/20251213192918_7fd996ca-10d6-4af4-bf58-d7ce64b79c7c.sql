-- Fix round-robin sequencing: Each consecutive position should have DIFFERENT region AND topic
-- Algorithm: For slot N, assign Region[N % 6] and Topic[N % 23]
-- This ensures both dimensions cycle through independently

-- First, clear existing queue to rebuild with correct sequencing
DELETE FROM editorial_queue;

-- Rebuild with proper round-robin where consecutive slots have different region AND topic
WITH ordered_regions AS (
  SELECT id, name, ROW_NUMBER() OVER (ORDER BY name) - 1 as idx
  FROM regions
),
ordered_topics AS (
  SELECT id, name, ROW_NUMBER() OVER (ORDER BY name) - 1 as idx
  FROM topics
),
sequence_slots AS (
  -- Generate 138 slots (6 regions × 23 topics)
  SELECT generate_series(0, 137) as slot_num
),
assignments AS (
  SELECT 
    s.slot_num,
    r.id as region_id,
    t.id as topic_id,
    r.name as region_name,
    t.name as topic_name
  FROM sequence_slots s
  JOIN ordered_regions r ON r.idx = s.slot_num % 6
  JOIN ordered_topics t ON t.idx = s.slot_num % 23
)
INSERT INTO editorial_queue (region_id, topic_id, initial_sequence, priority_score, status)
SELECT 
  region_id,
  topic_id,
  slot_num + 1 as initial_sequence,
  50 as priority_score,
  'pending' as status
FROM assignments
ORDER BY slot_num;