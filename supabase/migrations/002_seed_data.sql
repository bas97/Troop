-- ─── Equipment ────────────────────────────────────────────────────────────────
insert into equipment (id, name, category) values
  ('pullup_bar',      'Pull-up bar',       'bars'),
  ('parallel_bars',   'Parallel bars / Dip bars', 'bars'),
  ('rings',           'Gymnastic rings',   'suspended'),
  ('parallettes',     'Parallettes',       'static'),
  ('wall',            'Wall space',        'static'),
  ('bench',           'Bench',             'static'),
  ('resistance_bands','Resistance bands',  'static'),
  ('weights',         'Weights (dumbbell / kettlebell / plates)', 'weighted'),
  ('floor',           'Floor',             'floor'),
  ('foot_anchor',     'Foot anchor (for Nordics)', 'static')
on conflict (id) do nothing;

-- ─── Skills ───────────────────────────────────────────────────────────────────
insert into skills (id, name, family, type, recommended_frequency, description) values
  ('planche',       'Planche',               'pushing',  'static',  4, 'Straight-arm pushing hold with body parallel to ground'),
  ('hspu',          'Handstand Push-up',     'pushing',  'dynamic', 3, 'Overhead pressing skill from a handstand position'),
  ('front_lever',   'Front Lever',           'pulling',  'static',  4, 'Straight-arm pulling hold with body horizontal'),
  ('back_lever',    'Back Lever',            'pulling',  'static',  4, 'Inverted horizontal hold with body parallel to ground'),
  ('muscle_up',     'Muscle-Up',             'pulling',  'dynamic', 3, 'Explosive transition from pull-up to dip above the bar or rings'),
  ('one_arm_pu',    'One-Arm Pull-Up',       'pulling',  'dynamic', 2, 'Single-arm pull-up to full elbow extension'),
  ('handstand',     'Handstand',             'balance',  'static',  6, 'Inverted balance on two hands — the foundation of all pushing skills'),
  ('l_sit',         'L-Sit / V-Sit',         'balance',  'static',  3, 'Compression hold with legs parallel (or above) to ground'),
  ('human_flag',    'Human Flag',            'balance',  'static',  2, 'Horizontal hold on a vertical pole using lateral force'),
  ('pistol_squat',  'Pistol Squat',          'legs',     'dynamic', 3, 'Single-leg squat to full depth with opposite leg extended'),
  ('shrimp_squat',  'Shrimp Squat',          'legs',     'dynamic', 3, 'Single-leg squat with rear foot elevated behind the body'),
  ('nordic_curl',   'Nordic Curl',           'legs',     'dynamic', 2, 'Eccentric hamstring exercise anchoring feet and lowering body to ground')
on conflict (id) do nothing;

-- ─── PROGRESSIONS ─────────────────────────────────────────────────────────────

-- PLANCHE
insert into progressions (id, skill_id, level, name, unlock_criteria, equipment_required, equipment_preferred, difficulty_modifiers, form_cues, common_mistakes, supplementary_exercises) values
('planche_lean',         'planche', 1, 'Planche Lean',
  '{"type":"hold_time","target_value":30,"target_sets":3,"consecutive_sessions":3}',
  '{"floor"}', '{"parallettes"}', '{"parallettes":0.8,"rings":1.6}',
  '{"Push floor away, depress shoulders","Shift weight forward 30° beyond wrists","Keep arms locked straight"}',
  '{"Bending arms","Not shifting far enough forward","Wrist pain from loading"}',
  '{"wrist_conditioning","shoulder_external_rotation"}'),

('planche_frog',         'planche', 2, 'Frog Stand',
  '{"type":"hold_time","target_value":30,"target_sets":3,"consecutive_sessions":3}',
  '{"floor"}', '{"parallettes"}', '{"parallettes":0.8}',
  '{"Knees rest on upper arms — not inside elbows","Gaze forward, not down","Slow controlled balance"}',
  '{"Feet not leaving floor","Panicking and stepping down"}',
  '{"planche_lean","wrist_conditioning"}'),

('planche_tuck',         'planche', 3, 'Tuck Planche',
  '{"type":"hold_time","target_value":10,"target_sets":3,"consecutive_sessions":3}',
  '{"floor"}', '{"parallettes"}', '{"parallettes":0.8,"rings":1.6}',
  '{"Hips must be level with shoulders — not higher","Push floor away with protracted scapulae","Hollow body, not arched"}',
  '{"Hips piked too high","Arms not locked","Insufficient scapular protraction"}',
  '{"pseudo_planche_pushup","planche_lean_weighted","scapular_push_ups"}'),

('planche_adv_tuck',     'planche', 4, 'Advanced Tuck Planche',
  '{"type":"hold_time","target_value":10,"target_sets":3,"consecutive_sessions":3}',
  '{"floor"}', '{"parallettes"}', '{"parallettes":0.8,"rings":1.6}',
  '{"Flat back — no hip pike","Extend spine, bring hips down to shoulder height","Press the floor away throughout"}',
  '{"Hips still too high","Lower back arching instead of flattening","Collapsing at the shoulder"}',
  '{"pseudo_planche_pushup","planche_lean_weighted","ring_straight_arm_press"}'),

('planche_straddle',     'planche', 5, 'Straddle Planche',
  '{"type":"hold_time","target_value":5,"target_sets":3,"consecutive_sessions":3}',
  '{"floor"}', '{"parallettes"}', '{"parallettes":0.8,"rings":1.6}',
  '{"Legs straddled wide to shorten effective lever arm","Engage glutes and inner thighs","Maintain full scapular protraction"}',
  '{"Hips sagging","Insufficient shoulder strength to bridge adv tuck to straddle"}',
  '{"pseudo_planche_pushup","planche_lean_weighted","banded_planche"}'),

('planche_half_lay',     'planche', 6, 'Half-Lay Planche',
  '{"type":"hold_time","target_value":5,"target_sets":3,"consecutive_sessions":3}',
  '{"floor"}', '{"parallettes"}', '{"parallettes":0.8,"rings":1.6}',
  '{"Legs together, slight bend at knees","Transition toward full by extending legs gradually"}',
  '{"Lower back arch","Hip drop"}',
  '{"planche_lean_weighted","ring_fly"}'),

('planche_full',         'planche', 7, 'Full Planche',
  '{"type":"hold_time","target_value":5,"target_sets":3,"consecutive_sessions":3}',
  '{"floor"}', '{"parallettes"}', '{"parallettes":0.8,"rings":1.6}',
  '{"Arms locked, body perfectly horizontal","Full scapular protraction","Neutral spine, locked glutes and core"}',
  '{"Any hip drop","Bent arms"}',
  '{"planche_lean_weighted"}');

-- HANDSTAND PUSH-UP
insert into progressions (id, skill_id, level, name, unlock_criteria, equipment_required, equipment_preferred, difficulty_modifiers, form_cues, common_mistakes, supplementary_exercises) values
('hspu_pike',            'hspu', 1, 'Pike Push-up',
  '{"type":"reps","target_value":10,"target_sets":3,"consecutive_sessions":3}',
  '{"floor"}', '{}', '{}',
  '{"Hips high, hands shoulder-width","Lower head between hands","Full ROM"}',
  '{"Flared elbows","Partial range of motion"}',
  '{"dips","shoulder_external_rotation"}'),

('hspu_elevated_pike',   'hspu', 2, 'Elevated Pike Push-up',
  '{"type":"reps","target_value":8,"target_sets":3,"consecutive_sessions":3}',
  '{"floor","bench"}', '{}', '{}',
  '{"Feet elevated increases shoulder load","Maintain vertical forearms"}',
  '{"Collapsing at top","Insufficient depth"}',
  '{"dips","pike_push_up"}'),

('hspu_wall_partial',    'hspu', 3, 'Wall HSPU (partial ROM)',
  '{"type":"reps","target_value":5,"target_sets":3,"consecutive_sessions":3}',
  '{"floor","wall"}', '{}', '{}',
  '{"Kick up to wall, stack shoulders over wrists","Partial descent to build strength"}',
  '{"Banana shape — ribs flared, back arched","Wrist too far from wall"}',
  '{"elevated_pike_pushup","wall_handstand"}'),

('hspu_wall_full',       'hspu', 4, 'Wall HSPU (full ROM)',
  '{"type":"reps","target_value":5,"target_sets":3,"consecutive_sessions":3}',
  '{"floor","wall"}', '{}', '{}',
  '{"Head touches floor each rep","Press to full lockout","Elbows track slightly forward, not flared"}',
  '{"Head plant without pressing back up","Neck strain from forward lean"}',
  '{"negative_hspu","dips"}'),

('hspu_deficit',         'hspu', 5, 'Deficit Wall HSPU',
  '{"type":"reps","target_value":5,"target_sets":3,"consecutive_sessions":3}',
  '{"floor","wall","parallettes"}', '{"parallettes"}', '{}',
  '{"Hands on parallettes or books increase ROM below floor level","Deeper stretch at bottom"}',
  '{"Shoulder impingement from going too deep too fast"}',
  '{"wall_hspu","dips"}'),

('hspu_freestanding',    'hspu', 6, 'Freestanding HSPU',
  '{"type":"reps","target_value":1,"target_sets":3,"consecutive_sessions":3}',
  '{"floor"}', '{"parallettes"}', '{"parallettes":0.85}',
  '{"Balance is the key — maintain hollow body throughout","Fingertips control balance","Slow descent aids balance"}',
  '{"Over-extending at top","Collapsing at shoulder"}',
  '{"deficit_wall_hspu","freestanding_handstand"}');

-- FRONT LEVER
insert into progressions (id, skill_id, level, name, unlock_criteria, equipment_required, equipment_preferred, difficulty_modifiers, form_cues, common_mistakes, supplementary_exercises) values
('fl_dead_hang',         'front_lever', 1, 'Active Dead Hang',
  '{"type":"hold_time","target_value":30,"target_sets":3,"consecutive_sessions":3}',
  '{"pullup_bar"}', '{"rings"}', '{"rings":1.3}',
  '{"Depress and retract scapulae — no passive hang","Arms locked","Core braced"}',
  '{"Passive hang with shrugged shoulders"}',
  '{"scapular_pullups","band_pull_aparts"}'),

('fl_tuck',              'front_lever', 2, 'Tuck Front Lever',
  '{"type":"hold_time","target_value":10,"target_sets":3,"consecutive_sessions":3}',
  '{"pullup_bar"}', '{"rings"}', '{"rings":1.3}',
  '{"Knees tucked to chest, hips level with shoulders","Depress scapulae throughout","Arms locked"}',
  '{"Hips hanging below shoulder line","Bent arms"}',
  '{"front_lever_rows","dragon_flag"}'),

('fl_adv_tuck',          'front_lever', 3, 'Advanced Tuck Front Lever',
  '{"type":"hold_time","target_value":10,"target_sets":3,"consecutive_sessions":3}',
  '{"pullup_bar"}', '{"rings"}', '{"rings":1.3}',
  '{"Flat back — extend spine so back is parallel to ground","Knees still tucked but hips back"}',
  '{"Hip pike — not extending spine enough","Losing scapular depression under fatigue"}',
  '{"front_lever_rows","weighted_pullups","ice_cream_makers"}'),

('fl_one_leg',           'front_lever', 4, 'One-Leg Front Lever',
  '{"type":"hold_time","target_value":8,"target_sets":3,"consecutive_sessions":3}',
  '{"pullup_bar"}', '{"rings"}', '{"rings":1.3}',
  '{"One leg extended, one tucked — alternate legs each set","Keep extended leg in line with body"}',
  '{"Dropping the extended leg below horizontal"}',
  '{"fl_rows_straddle","negative_front_lever"}'),

('fl_straddle',          'front_lever', 5, 'Straddle Front Lever',
  '{"type":"hold_time","target_value":5,"target_sets":3,"consecutive_sessions":3}',
  '{"pullup_bar"}', '{"rings"}', '{"rings":1.3}',
  '{"Legs wide to reduce lever arm","Body horizontal — imagine a plank from shoulders to hips","Glutes locked"}',
  '{"Legs drooping — hips below shoulders","Core not engaged"}',
  '{"weighted_pullups","negative_full_fl","fl_rows"}'),

('fl_half_lay',          'front_lever', 6, 'Half-Lay Front Lever',
  '{"type":"hold_time","target_value":5,"target_sets":3,"consecutive_sessions":3}',
  '{"pullup_bar"}', '{"rings"}', '{"rings":1.3}',
  '{"Legs together, knees slightly bent","Gradual transition toward full"}',
  '{"Bending too much at knees — should be minimal"}',
  '{"negative_full_fl","weighted_pullups"}'),

('fl_full',              'front_lever', 7, 'Full Front Lever',
  '{"type":"hold_time","target_value":5,"target_sets":3,"consecutive_sessions":3}',
  '{"pullup_bar"}', '{"rings"}', '{"rings":1.3}',
  '{"Body perfectly horizontal, arms locked, legs together","Squeeze glutes, brace abs as if being punched","Shoulders depress away from ears"}',
  '{"Any hip drop","Bent arms","Head not neutral"}',
  '{"weighted_pullups","negative_full_fl"}');

-- BACK LEVER
insert into progressions (id, skill_id, level, name, unlock_criteria, equipment_required, equipment_preferred, difficulty_modifiers, form_cues, common_mistakes, supplementary_exercises) values
('bl_german_hang',       'back_lever', 1, 'German Hang / Skin the Cat',
  '{"type":"hold_time","target_value":30,"target_sets":3,"consecutive_sessions":3}',
  '{"pullup_bar"}', '{"rings"}', '{"rings":1.2}',
  '{"Hang in shoulder extension — arms straight","Gradual increase in depth of extension","Never force range of motion"}',
  '{"Forcing extension before tissue is ready","Bending arms"}',
  '{"band_shoulder_extension","rear_delt_fly"}'),

('bl_tuck',              'back_lever', 2, 'Tuck Back Lever',
  '{"type":"hold_time","target_value":10,"target_sets":3,"consecutive_sessions":3}',
  '{"pullup_bar"}', '{"rings"}', '{"rings":1.2}',
  '{"Invert through bar/rings, hold with knees to chest","Maintain shoulder-extension lock"}',
  '{"Hips not level with shoulders"}',
  '{"german_hang","ring_support_hold"}'),

('bl_adv_tuck',          'back_lever', 3, 'Advanced Tuck Back Lever',
  '{"type":"hold_time","target_value":10,"target_sets":3,"consecutive_sessions":3}',
  '{"pullup_bar"}', '{"rings"}', '{"rings":1.2}',
  '{"Flat back — extend spine, hips level","More demanding on shoulder extension"}',
  '{"Back rounding — not extending spine enough"}',
  '{"german_hang","ring_support_hold"}'),

('bl_one_leg',           'back_lever', 4, 'One-Leg Back Lever',
  '{"type":"hold_time","target_value":8,"target_sets":3,"consecutive_sessions":3}',
  '{"pullup_bar"}', '{"rings"}', '{"rings":1.2}',
  '{"One leg extended, one tucked — alternate","Keep body line flat"}',
  '{"Extended leg not aligned with body"}',
  '{"bl_adv_tuck","skin_the_cat"}'),

('bl_straddle',          'back_lever', 5, 'Straddle Back Lever',
  '{"type":"hold_time","target_value":8,"target_sets":3,"consecutive_sessions":3}',
  '{"pullup_bar"}', '{"rings"}', '{"rings":1.2}',
  '{"Legs straddled, body horizontal","Squeeze glutes","Maintain shoulder extension throughout"}',
  '{"Hips sagging","Shoulder pain from excessive extension angle"}',
  '{"negative_full_bl","german_hang"}'),

('bl_full',              'back_lever', 6, 'Full Back Lever',
  '{"type":"hold_time","target_value":5,"target_sets":3,"consecutive_sessions":3}',
  '{"pullup_bar"}', '{"rings"}', '{"rings":1.2}',
  '{"Body perfectly horizontal, legs together","Arms locked in shoulder extension","Neutral head"}',
  '{"Hip drop","Any arm bend"}',
  '{"negative_full_bl"}');

-- MUSCLE-UP
insert into progressions (id, skill_id, level, name, unlock_criteria, equipment_required, equipment_preferred, difficulty_modifiers, form_cues, common_mistakes, supplementary_exercises) values
('mu_chest_bar',         'muscle_up', 1, 'Chest-to-Bar Pull-Up',
  '{"type":"reps","target_value":5,"target_sets":3,"consecutive_sessions":3}',
  '{"pullup_bar"}', '{"rings"}', '{"rings":1.3}',
  '{"Pull until sternum / lower chest touches bar","Elbows point behind you at the top","Full ROM — full hang at bottom"}',
  '{"Stopping at chin level","Kipping too early"}',
  '{"weighted_pullups","lat_pulldown"}'),

('mu_negative',          'muscle_up', 2, 'Negative Muscle-Up',
  '{"type":"reps","target_value":3,"target_sets":3,"consecutive_sessions":3}',
  '{"pullup_bar"}', '{"rings"}', '{"rings":1.3}',
  '{"Start above bar in support hold","Slow 3-5s descent through transition","Control the false grip on rings"}',
  '{"Too fast — no time under tension","Losing lat tension in descent"}',
  '{"ring_support_hold","straight_bar_dip"}'),

('mu_banded',            'muscle_up', 3, 'Banded Muscle-Up',
  '{"type":"reps","target_value":3,"target_sets":3,"consecutive_sessions":3}',
  '{"pullup_bar","resistance_bands"}', '{"rings","resistance_bands"}', '{}',
  '{"Band under hips or feet provides assistance","Use minimal assistance needed","Focus on clean transition"}',
  '{"Relying on band too much — reduce tension as you progress"}',
  '{"chest_to_bar_pullup","straight_bar_dip"}'),

('mu_kipping',           'muscle_up', 4, 'Kipping Muscle-Up',
  '{"type":"reps","target_value":1,"target_sets":3,"consecutive_sessions":3}',
  '{"pullup_bar"}', '{"rings"}', '{"rings":1.2}',
  '{"Generate hip drive from hollow to arch","Pull as hips rise","Transition quickly as you pass the bar"}',
  '{"Too much kip — relying on momentum only","Not getting hips high enough"}',
  '{"chest_to_bar_pullup","straight_bar_dip"}'),

('mu_strict_bar',        'muscle_up', 5, 'Strict Bar Muscle-Up',
  '{"type":"reps","target_value":1,"target_sets":3,"consecutive_sessions":3}',
  '{"pullup_bar"}', '{}', '{}',
  '{"No kip — pure pulling strength","Pull until bar is at hips, then transition","Push down into bar at top"}',
  '{"Leaning back too much","Stopping at transition"}',
  '{"chest_to_bar_pullup","weighted_pullup","straight_bar_dip"}'),

('mu_ring',              'muscle_up', 6, 'Ring Muscle-Up',
  '{"type":"reps","target_value":1,"target_sets":3,"consecutive_sessions":3}',
  '{"rings"}', '{}', '{}',
  '{"False grip throughout","Rings turn out at top","Keep rings close to body during transition"}',
  '{"Losing false grip mid-rep","Rings flaring out at bottom","Not achieving full lockout"}',
  '{"false_grip_hang","ring_dips","bar_muscle_up"}');

-- ONE-ARM PULL-UP
insert into progressions (id, skill_id, level, name, unlock_criteria, equipment_required, equipment_preferred, difficulty_modifiers, form_cues, common_mistakes, supplementary_exercises) values
('oapu_weighted',        'one_arm_pu', 1, 'Weighted Pull-Ups (+50% BW)',
  '{"type":"reps","target_value":5,"target_sets":3,"consecutive_sessions":3}',
  '{"pullup_bar","weights"}', '{}', '{}',
  '{"Add weight until you reach 50% of bodyweight extra","Full ROM every rep","No kipping"}',
  '{"Partial ROM","Kipping"}',
  '{"weighted_pullup","band_pulldown"}'),

('oapu_archer',          'one_arm_pu', 2, 'Archer Pull-Up',
  '{"type":"reps","target_value":5,"target_sets":3,"consecutive_sessions":3}',
  '{"pullup_bar"}', '{}', '{}',
  '{"Wide grip, pull to one side — working arm bends while other stays straight","Shift weight progressively to working arm"}',
  '{"Not keeping assisting arm straight","Not shifting enough weight"}',
  '{"weighted_pullup","towel_pullup"}'),

('oapu_uneven',          'one_arm_pu', 3, 'Uneven Pull-Up (towel/band)',
  '{"type":"reps","target_value":3,"target_sets":3,"consecutive_sessions":3}',
  '{"pullup_bar","resistance_bands"}', '{}', '{}',
  '{"One hand on bar, other grips lower point (towel, band, lower rung)","Gradually lower the assisting hand"}',
  '{"Too much assistance — reduce as you get stronger"}',
  '{"archer_pullup","weighted_pullup"}'),

('oapu_negative',        'one_arm_pu', 4, 'Negative One-Arm Pull-Up',
  '{"type":"reps","target_value":3,"target_sets":3,"consecutive_sessions":3}',
  '{"pullup_bar"}', '{}', '{}',
  '{"Jump or step to top position","Lower with control over 5s with one arm","Opposite hand on torso or behind back"}',
  '{"Dropping too fast — use controlled descent","Rotating excessively"}',
  '{"archer_pullup","uneven_pullup"}'),

('oapu_flex_hang',       'one_arm_pu', 5, 'One-Arm Flex Hang',
  '{"type":"hold_time","target_value":10,"target_sets":3,"consecutive_sessions":3}',
  '{"pullup_bar"}', '{}', '{}',
  '{"Hold at 90° elbow with one arm","Engage lat fully","Other arm on torso or behind back"}',
  '{"Not activating lat — just bicep hanging"}',
  '{"negative_oapu","archer_pullup"}'),

('oapu_full',            'one_arm_pu', 6, 'Full One-Arm Pull-Up',
  '{"type":"reps","target_value":1,"target_sets":3,"consecutive_sessions":3}',
  '{"pullup_bar"}', '{}', '{}',
  '{"Pull elbow to hip — think about hip, not hand","Engage opposite lat to reduce rotation","Full ROM — lockout at top"}',
  '{"Excessive body rotation","Not reaching lockout"}',
  '{"negative_oapu","weighted_pullup"}');

-- HANDSTAND
insert into progressions (id, skill_id, level, name, unlock_criteria, equipment_required, equipment_preferred, difficulty_modifiers, form_cues, common_mistakes, supplementary_exercises) values
('hs_wall_plank',        'handstand', 1, 'Wall Plank (chest to wall)',
  '{"type":"hold_time","target_value":60,"target_sets":3,"consecutive_sessions":3}',
  '{"floor","wall"}', '{}', '{}',
  '{"Face wall, walk hands in close","Hands 6-12 inches from wall","Press through shoulders — no sag"}',
  '{"Banana back — ribs flared, hips piking"}',
  '{"hollow_body_hold","wrist_conditioning"}'),

('hs_wall_back',         'handstand', 2, 'Wall Handstand (back to wall)',
  '{"type":"hold_time","target_value":60,"target_sets":3,"consecutive_sessions":3}',
  '{"floor","wall"}', '{}', '{}',
  '{"Kick up with back to wall","Stack wrists-shoulders-hips","Press fingertips for balance fine-tuning"}',
  '{"Over-arching the back","Heels not touching wall"}',
  '{"wall_plank","shoulder_activation"}'),

('hs_chest_wall',        'handstand', 3, 'Chest-to-Wall Handstand',
  '{"type":"hold_time","target_value":60,"target_sets":3,"consecutive_sessions":3}',
  '{"floor","wall"}', '{}', '{}',
  '{"Walk hands away from wall until only toes touch","Posterior pelvic tilt, ribs down","This builds the correct hollow-body shape"}',
  '{"Too much arch","Hands too far from wall — not getting inverted enough"}',
  '{"wall_handstand_back","hollow_body"}'),

('hs_balance_drills',    'handstand', 4, 'Toe Pulls / Heel Pulls (balance drills)',
  '{"type":"reps","target_value":10,"target_sets":3,"consecutive_sessions":3}',
  '{"floor","wall"}', '{}', '{}',
  '{"Start chest-to-wall, gently peel toes off wall, find balance","Use fingertip pressure to control forward/backward tipping"}',
  '{"Panicking and pirouetting out — learn the pirouette exit first"}',
  '{"chest_wall_handstand","pirouette_exit"}'),

('hs_freestanding_kick', 'handstand', 5, 'Freestanding Handstand (kick-up entry)',
  '{"type":"hold_time","target_value":10,"target_sets":3,"consecutive_sessions":3}',
  '{"floor"}', '{"parallettes"}', '{"parallettes":0.9}',
  '{"Consistent kick-up mechanics","Look at a spot on the floor between hands","Fingertip pressure is your steering wheel"}',
  '{"Inconsistent kick — practice same leg every time","Over-kicking and arching"}',
  '{"balance_drills","pirouette_exit","shoulder_shrugs"}'),

('hs_freestanding_press','handstand', 6, 'Freestanding Handstand (press-up entry)',
  '{"type":"hold_time","target_value":30,"target_sets":3,"consecutive_sessions":3}',
  '{"floor"}', '{"parallettes"}', '{"parallettes":0.9}',
  '{"Press from straddle or pike — requires pike compression strength","Straight arms throughout — no bent-arm press"}',
  '{"Using bent arms as a shortcut — does not train the skill correctly"}',
  '{"pike_compression","straddle_press_drill"}'),

('hs_one_arm',           'handstand', 7, 'One-Arm Handstand',
  '{"type":"hold_time","target_value":5,"target_sets":3,"consecutive_sessions":3}',
  '{"floor"}', '{"parallettes"}', '{"parallettes":0.9}',
  '{"Load one arm gradually — lean and counter-lean with free arm","Hip shift to counterbalance","Fingertip control is amplified — extremely sensitive"}',
  '{"Not shifting hips to counterbalance","Gripping with palm instead of fingertips"}',
  '{"freestanding_hs","shoulder_taps"}');

-- L-SIT / V-SIT
insert into progressions (id, skill_id, level, name, unlock_criteria, equipment_required, equipment_preferred, difficulty_modifiers, form_cues, common_mistakes, supplementary_exercises) values
('lsit_foot_support',    'l_sit', 1, 'Foot-Supported L-Sit',
  '{"type":"hold_time","target_value":30,"target_sets":3,"consecutive_sessions":3}',
  '{"floor","parallel_bars"}', '{"parallettes","parallel_bars"}', '{"floor":1.2}',
  '{"One or both feet on ground, arms locked, depress shoulders","Builds shoulder depression strength"}',
  '{"Not depressing scapulae — just hanging"}',
  '{"scapular_depression_hold","hollow_body"}'),

('lsit_one_leg',         'l_sit', 2, 'One-Leg L-Sit',
  '{"type":"hold_time","target_value":20,"target_sets":3,"consecutive_sessions":3}',
  '{"floor","parallel_bars"}', '{"parallettes","parallel_bars"}', '{"floor":1.2}',
  '{"One leg raised parallel to floor, other foot on ground","Alternate legs each set"}',
  '{"Raised leg dropping below horizontal","Body leaning back"}',
  '{"foot_support_lsit","hip_flexor_raises"}'),

('lsit_tuck',            'l_sit', 3, 'Tuck L-Sit',
  '{"type":"hold_time","target_value":20,"target_sets":3,"consecutive_sessions":3}',
  '{"floor","parallel_bars"}', '{"parallettes","parallel_bars"}', '{"floor":1.2}',
  '{"Both feet off ground, knees tucked to chest","Arms locked, shoulders depressed"}',
  '{"Feet touching ground","Shoulders rising to ears"}',
  '{"one_leg_lsit","pike_compression"}'),

('lsit_full',            'l_sit', 4, 'Full L-Sit',
  '{"type":"hold_time","target_value":15,"target_sets":3,"consecutive_sessions":3}',
  '{"floor","parallel_bars"}', '{"parallettes","parallel_bars"}', '{"floor":1.2}',
  '{"Both legs extended parallel to floor","Legs together, toes pointed","Arms locked, shoulders depressed — not shrugged"}',
  '{"Legs dropping — insufficient hip flexor strength","Arms bending","Floor: add 20% difficulty vs. parallettes"}',
  '{"tuck_lsit","pike_compression","hip_flexor_raises"}'),

('lsit_above_par',       'l_sit', 5, 'L-Sit (legs above parallel)',
  '{"type":"hold_time","target_value":10,"target_sets":3,"consecutive_sessions":3}',
  '{"parallel_bars"}', '{"parallettes","parallel_bars"}', '{}',
  '{"Raise legs slightly above horizontal — first step toward V-sit","Use pike compression drills to build strength"}',
  '{"Compensating with a lean-back instead of genuine hip flexor strength"}',
  '{"full_lsit","pike_compression_seated"}'),

('lsit_vsit',            'l_sit', 6, 'V-Sit',
  '{"type":"hold_time","target_value":5,"target_sets":3,"consecutive_sessions":3}',
  '{"parallel_bars"}', '{"parallettes","parallel_bars"}', '{}',
  '{"Legs 45°+ above horizontal, forming a V with torso","Extreme hip flexor compression required","Lean torso back slightly for balance"}',
  '{"Hips behind hands — not sitting over hands","Insufficient compression strength"}',
  '{"pike_compression","seated_leg_raises"}'),

('lsit_manna',           'l_sit', 7, 'Manna',
  '{"type":"hold_time","target_value":3,"target_sets":3,"consecutive_sessions":3}',
  '{"parallel_bars"}', '{"parallettes"}', '{}',
  '{"Legs vertical (or past vertical) with extreme hip flexor and shoulder extension","Years of compression training required"}',
  '{"Rushing progression — this is a multi-year skill"}',
  '{"vsit","advanced_compression"}');

-- HUMAN FLAG
insert into progressions (id, skill_id, level, name, unlock_criteria, equipment_required, equipment_preferred, difficulty_modifiers, form_cues, common_mistakes, supplementary_exercises) values
('flag_vertical',        'human_flag', 1, 'Vertical Flag (body vertical)',
  '{"type":"hold_time","target_value":15,"target_sets":3,"consecutive_sessions":3}',
  '{"pullup_bar"}', '{}', '{}',
  '{"Grip vertical pole, bottom arm pushes, top arm pulls","Body vertical first — then work toward horizontal"}',
  '{"Both arms pulling — need push/pull force pair"}',
  '{"side_plank","pull_push_on_pole"}'),

('flag_tuck',            'human_flag', 2, 'Tuck Human Flag',
  '{"type":"hold_time","target_value":10,"target_sets":3,"consecutive_sessions":3}',
  '{"pullup_bar"}', '{}', '{}',
  '{"Knees tucked, body approaching horizontal","Push bottom arm, pull top arm","Body should be horizontal, not diagonal"}',
  '{"Insufficient push force from bottom arm"}',
  '{"vertical_flag","lateral_raises","oblique_work"}'),

('flag_one_leg',         'human_flag', 3, 'One-Leg Human Flag',
  '{"type":"hold_time","target_value":8,"target_sets":3,"consecutive_sessions":3}',
  '{"pullup_bar"}', '{}', '{}',
  '{"One leg extended, one tucked","Keep hips horizontal"}',
  '{"Body tilting — not horizontal"}',
  '{"tuck_flag"}'),

('flag_straddle',        'human_flag', 4, 'Straddle Human Flag',
  '{"type":"hold_time","target_value":5,"target_sets":3,"consecutive_sessions":3}',
  '{"pullup_bar"}', '{}', '{}',
  '{"Legs wide to reduce lever arm","Horizontal body line"}',
  '{"Body not horizontal — angled downward"}',
  '{"one_leg_flag"}'),

('flag_full',            'human_flag', 5, 'Full Human Flag',
  '{"type":"hold_time","target_value":5,"target_sets":3,"consecutive_sessions":3}',
  '{"pullup_bar"}', '{}', '{}',
  '{"Legs together, body perfectly horizontal","Top arm pulls, bottom arm pushes","Core rigid throughout"}',
  '{"Any downward angle","Hips sagging"}',
  '{"straddle_flag","lateral_cable_raises"}');

-- PISTOL SQUAT
insert into progressions (id, skill_id, level, name, unlock_criteria, equipment_required, equipment_preferred, difficulty_modifiers, form_cues, common_mistakes, supplementary_exercises) values
('pistol_assisted',      'pistol_squat', 1, 'Assisted Pistol Squat',
  '{"type":"reps","target_value":10,"target_sets":3,"consecutive_sessions":3}',
  '{"floor"}', '{}', '{}',
  '{"Hold onto support (doorframe, post)","Sit as deep as possible","Counterbalance opposite arm forward"}',
  '{"Heel rising — ankle mobility issue"}',
  '{"ankle_mobility","calf_stretch"}'),

('pistol_bw_squat',      'pistol_squat', 2, 'Deep Bodyweight Squat',
  '{"type":"reps","target_value":15,"target_sets":3,"consecutive_sessions":3}',
  '{"floor"}', '{}', '{}',
  '{"Heels flat, full depth, knees tracking over toes","Hold bottom for 1-2s"}',
  '{"Heels rising","Knees caving"}',
  '{"ankle_mobility","hip_flexor_stretch"}'),

('pistol_bulgarian',     'pistol_squat', 3, 'Bulgarian Split Squat',
  '{"type":"reps","target_value":10,"target_sets":3,"consecutive_sessions":3}',
  '{"floor","bench"}', '{}', '{}',
  '{"Rear foot elevated, front foot far enough forward","Vertical shin on front leg","Torso upright"}',
  '{"Front knee caving","Torso leaning forward excessively"}',
  '{"bw_squat","hip_flexor_stretch"}'),

('pistol_band_assist',   'pistol_squat', 4, 'Band-Assisted Pistol Squat',
  '{"type":"reps","target_value":5,"target_sets":3,"consecutive_sessions":3}',
  '{"floor","resistance_bands"}', '{"resistance_bands"}', '{}',
  '{"Band from overhead or anchor provides assist at bottom","Reduce band tension over sessions"}',
  '{"Not sitting all the way to bottom — partial ROM"}',
  '{"bulgarian_split_squat","ankle_mobility"}'),

('pistol_box',           'pistol_squat', 5, 'Box Pistol Squat',
  '{"type":"reps","target_value":5,"target_sets":3,"consecutive_sessions":3}',
  '{"floor","bench"}', '{}', '{}',
  '{"Squat to elevated surface (box, bench, chair)","Lower the box over sessions until full depth"}',
  '{"Dropping onto box — control the descent"}',
  '{"band_pistol","ankle_mobility"}'),

('pistol_full',          'pistol_squat', 6, 'Full Pistol Squat',
  '{"type":"reps","target_value":5,"target_sets":3,"consecutive_sessions":3}',
  '{"floor"}', '{}', '{}',
  '{"Full depth — hamstring on calf","Opposite leg extended forward","Arms forward as counterbalance","Heel flat throughout"}',
  '{"Heel rising","Excessive forward lean","Loss of balance at bottom"}',
  '{"box_pistol","ankle_circles"}');

-- SHRIMP SQUAT
insert into progressions (id, skill_id, level, name, unlock_criteria, equipment_required, equipment_preferred, difficulty_modifiers, form_cues, common_mistakes, supplementary_exercises) values
('shrimp_split',         'shrimp_squat', 1, 'Split Squat',
  '{"type":"reps","target_value":10,"target_sets":3,"consecutive_sessions":3}',
  '{"floor"}', '{}', '{}',
  '{"Feet split front/back, lower back knee toward floor","Keep torso upright"}',
  '{"Knee collapsing inward"}',
  '{"hip_flexor_stretch","quad_stretch"}'),

('shrimp_bess',          'shrimp_squat', 2, 'Rear-Foot-Elevated Split Squat (Bulgarian)',
  '{"type":"reps","target_value":10,"target_sets":3,"consecutive_sessions":3}',
  '{"floor","bench"}', '{}', '{}',
  '{"Rear foot elevated increases quad demand","Drive through front heel"}',
  '{"Knee drive past toes excessively"}',
  '{"split_squat","quad_stretch"}'),

('shrimp_assisted',      'shrimp_squat', 3, 'Assisted Shrimp Squat',
  '{"type":"reps","target_value":5,"target_sets":3,"consecutive_sessions":3}',
  '{"floor"}', '{}', '{}',
  '{"Hold rear foot with same-side hand","Use other hand on support","Lower knee toward floor"}',
  '{"Rear foot not gripped — loses balance"}',
  '{"bulgarian_split","quad_stretch"}'),

('shrimp_partial',       'shrimp_squat', 4, 'Partial ROM Shrimp Squat',
  '{"type":"reps","target_value":5,"target_sets":3,"consecutive_sessions":3}',
  '{"floor"}', '{}', '{}',
  '{"No support, knee to ~6 inches from floor","Increase depth over sessions"}',
  '{"Knee hitting floor without control"}',
  '{"assisted_shrimp"}'),

('shrimp_full',          'shrimp_squat', 5, 'Full Shrimp Squat',
  '{"type":"reps","target_value":5,"target_sets":3,"consecutive_sessions":3}',
  '{"floor"}', '{}', '{}',
  '{"Knee touches floor with control","Upright torso","Full depth without support"}',
  '{"Torso falling forward","Losing balance at bottom"}',
  '{"partial_shrimp"}');

-- NORDIC CURL
insert into progressions (id, skill_id, level, name, unlock_criteria, equipment_required, equipment_preferred, difficulty_modifiers, form_cues, common_mistakes, supplementary_exercises) values
('nordic_hold',          'nordic_curl', 1, 'Nordic Hold (top position)',
  '{"type":"hold_time","target_value":15,"target_sets":3,"consecutive_sessions":3}',
  '{"floor","foot_anchor"}', '{}', '{}',
  '{"Kneel, feet anchored, lock body in straight line from knee to shoulder","Arms crossed on chest","Brace core — do not hinge at hips"}',
  '{"Hinging at hips instead of staying rigid"}',
  '{"hamstring_bridge","hip_hinge"}'),

('nordic_negative',      'nordic_curl', 2, 'Nordic Negative (eccentric only)',
  '{"type":"reps","target_value":5,"target_sets":3,"consecutive_sessions":3}',
  '{"floor","foot_anchor"}', '{}', '{}',
  '{"Lower with control over 5s","Keep rigid body line","Use hands to press back up (concentric is assisted)"}',
  '{"Going too fast — no eccentric benefit","Hamstring cramping — warm up thoroughly"}',
  '{"nordic_hold","glute_ham_raise"}'),

('nordic_banded',        'nordic_curl', 3, 'Band-Assisted Nordic Curl',
  '{"type":"reps","target_value":5,"target_sets":3,"consecutive_sessions":3}',
  '{"floor","foot_anchor","resistance_bands"}', '{"resistance_bands"}', '{}',
  '{"Band around torso assists the concentric phase","Reduce assistance over time"}',
  '{"Band assisting too much — build up gradually"}',
  '{"nordic_negative"}'),

('nordic_partial',       'nordic_curl', 4, 'Partial ROM Nordic Curl',
  '{"type":"reps","target_value":5,"target_sets":3,"consecutive_sessions":3}',
  '{"floor","foot_anchor"}', '{}', '{}',
  '{"Full concentric (curl up from halfway position)","Eccentric to halfway point only"}',
  '{"Torso not staying rigid"}',
  '{"banded_nordic"}'),

('nordic_full',          'nordic_curl', 5, 'Full Nordic Curl',
  '{"type":"reps","target_value":5,"target_sets":3,"consecutive_sessions":3}',
  '{"floor","foot_anchor"}', '{}', '{}',
  '{"Full eccentric and concentric","Rigid body line throughout","2-3s descent minimum"}',
  '{"Lower back compensation — hinging at hips","Hamstring cramping from rushing"}',
  '{"partial_nordic"}');
