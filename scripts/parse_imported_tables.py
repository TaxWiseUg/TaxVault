import csv
import io
import json
import os

AUDIT_LOGS_RAW = """id,action,performed_by,metadata,created_at
00ba8ec4-26bb-4f6e-af7b-4ac3ea9b4887,precedent_created,a9e5e811-1a15-4c68-be82-faa5ce05bc24,"{""case_number"":""TAT No. 207 of 2024""}",2026-07-06 11:21:56.065154+00
0459aa6d-9f46-423b-b863-9cbde66262b5,precedent_created,a9e5e811-1a15-4c68-be82-faa5ce05bc24,"{""case_number"":""TAT No. 68 of 2024""}",2026-07-04 20:00:36.539188+00
05853743-9cdd-4fe6-a4df-9a95b9df1797,precedent_deleted,2659af7a-7132-426d-a1fb-a3fbe5a12848,"{""case_number"":""APPLICATION NO. 73 Of 2026"",""precedent_id"":""06254497-99c9-4e76-8120-2971eb3cf8af""}",2026-07-04 14:53:13.849755+00
0b7cc3c2-7c73-42fe-b50a-425f088a954c,precedent_created,a9e5e811-1a15-4c68-be82-faa5ce05bc24,"{""case_number"":""TAT APPLICATION NO. 54 OF 2022""}",2026-07-04 19:59:22.66663+00
0f8b9034-9bf0-4e9d-a60a-e3963e0f16c6,precedent_created,a9e5e811-1a15-4c68-be82-faa5ce05bc24,"{""case_number"":""TAT APPLICATION NO. 98 OF 2025""}",2026-07-04 16:57:07.964657+00
10188540-1dfd-4900-a4d5-f8f3d9434ac1,precedent_created,a9e5e811-1a15-4c68-be82-faa5ce05bc24,"{""case_number"":""MISC. APPLICATION NO.72/2024 (ARISING FROM TAT NO. 135/2023)""}",2026-07-06 11:18:50.284515+00
144d59ad-883c-41fe-ab15-b1dbb3df3765,precedent_created,a9e5e811-1a15-4c68-be82-faa5ce05bc24,"{""case_number"":""APPLICATION NO. 36 OF 2020""}",2026-07-04 15:35:55.925471+00
161e3230-ebcc-4095-a325-4885fad178a3,precedent_created,a9e5e811-1a15-4c68-be82-faa5ce05bc24,"{""case_number"":""TAT No. 113 of 2025""}",2026-07-04 21:31:01.710612+00
1c5ed3e4-2d32-4da7-9098-962ebc4e2cb8,precedent_created,a9e5e811-1a15-4c68-be82-faa5ce05bc24,"{""case_number"":""APPLICATION NO. 251 OF 2022""}",2026-07-04 16:18:26.230405+00
20be0b54-3f24-4208-b7c5-e5cf555befd8,precedent_created,2659af7a-7132-426d-a1fb-a3fbe5a12848,"{""case_number"":""TAT No. 185 of 2025""}",2026-07-04 09:41:19.748459+00
24119c36-d4c6-42a2-befa-512f59d1d443,precedent_created,a9e5e811-1a15-4c68-be82-faa5ce05bc24,"{""case_number"":""MISC APPLICATION NO. 82 & 97 OF 2025 (ARISING FROM TAT APPLICATION NO. 118 & 131 OF 2025)""}",2026-07-07 16:59:37.129032+00
25b617de-2d6f-4a8e-b1a2-ffb9f41967ed,precedent_created,a9e5e811-1a15-4c68-be82-faa5ce05bc24,"{""case_number"":""TAT APPLICATION NO. 381 OF 2024""}",2026-07-04 17:00:52.060776+00
2ddfb1b8-2f23-4a65-be06-3aa7bf571a1b,precedent_created,a9e5e811-1a15-4c68-be82-faa5ce05bc24,"{""case_number"":""TAT APPLICATION NO. 276 OF 2024""}",2026-07-04 21:29:28.137528+00
2e5a0e0b-164e-4bb0-a62c-d84d35e8f933,precedent_created,a9e5e811-1a15-4c68-be82-faa5ce05bc24,"{""case_number"":""TAT APPLICATION NO. 128 OF 2025""}",2026-07-04 16:08:02.124039+00
2fd94b3f-b861-4992-ab70-ebde39041e21,precedent_created,a9e5e811-1a15-4c68-be82-faa5ce05bc24,"{""case_number"":""APPLICATION NO. 366 OF 2024""}",2026-07-04 16:58:59.212689+00
2ff3f5e5-4778-4ae5-a807-989aa8e1fe80,precedent_created,a9e5e811-1a15-4c68-be82-faa5ce05bc24,"{""case_number"":""TAT No. 004 of 2024""}",2026-07-06 18:11:48.34424+00
317a740d-24e7-4a9c-bb56-407412d918a8,precedent_created,a9e5e811-1a15-4c68-be82-faa5ce05bc24,"{""case_number"":""APPLICATION NO.193 OF 2024""}",2026-07-04 15:24:01.329645+00
3326be69-d24a-4588-b0bc-05e1444369b1,precedent_created,a9e5e811-1a15-4c68-be82-faa5ce05bc24,"{""case_number"":""TAT APLICATION NO. 259 OF 2022""}",2026-07-04 15:50:05.330903+00
348444a9-efc7-4801-8136-fd0f9a6eadd8,precedent_created,a9e5e811-1a15-4c68-be82-faa5ce05bc24,"{""case_number"":""TAT No. 93 of 2022""}",2026-07-04 15:19:03.225426+00
360d9825-699f-4ef9-b543-5bf6dd8370d9,precedent_created,a9e5e811-1a15-4c68-be82-faa5ce05bc24,"{""case_number"":""TAT ARU NO. 002 OF 2024""}",2026-07-04 15:48:18.48643+00
38cf6a9a-b5f0-45dc-911f-8fda75cf31e7,precedent_created,a9e5e811-1a15-4c68-be82-faa5ce05bc24,"{""case_number"":""TAT No. 005 of 2024""}",2026-07-04 20:09:37.505525+00
3abd0d6d-c789-4cd0-a116-0b41202344c7,precedent_created,a9e5e811-1a15-4c68-be82-faa5ce05bc24,"{""case_number"":""APPLICATION NO. 300 OF 2024""}",2026-07-04 21:30:19.425498+00
3c369700-cbe1-4015-85de-01eb2fe38a7a,precedent_created,a9e5e811-1a15-4c68-be82-faa5ce05bc24,"{""case_number"":""TAT APPLICATION NO.57 OF 2023""}",2026-07-04 15:59:44.221284+00
41c63145-9519-4454-bce1-af5f0c3762c6,precedent_created,a9e5e811-1a15-4c68-be82-faa5ce05bc24,"{""case_number"":""APPLICATION NO. 331 OF 2024""}",2026-07-04 20:08:20.327684+00
41ca14bf-76ad-4b8d-ab30-29ef04f96516,precedent_created,a9e5e811-1a15-4c68-be82-faa5ce05bc24,"{""case_number"":""APPLICATION NO. 274 OF 2025""}",2026-07-06 18:10:37.643779+00
41da55fb-c0f3-4802-bc9c-dd3f1e3fe26d,precedent_created,a9e5e811-1a15-4c68-be82-faa5ce05bc24,"{""case_number"":""TAT APPLICATION NO. 303 OF 2024""}",2026-07-08 10:00:05.573078+00
42dc8276-694a-4f81-bfdf-4560310f9eca,precedent_created,a9e5e811-1a15-4c68-be82-faa5ce05bc24,"{""case_number"":""TAT APPLICATION NO. 10 OF 2024""}",2026-07-04 15:58:38.84677+00
43bba7ab-4532-4a65-8983-b1f193f229e2,precedent_created,a9e5e811-1a15-4c68-be82-faa5ce05bc24,"{""case_number"":""MISCELLANEOUS APPLICATION NO. 130 OF 2024 (ARISING OUT OF TAT APPLICATION NO.227 OF 2022)""}",2026-07-06 17:57:01.738371+00
4441d95c-81ae-4bab-8aa2-b90b5caf27fb,precedent_created,2659af7a-7132-426d-a1fb-a3fbe5a12848,"{""case_number"":""APPLICATION NO. 73 Of 2026""}",2026-07-04 15:12:49.675243+00
448ccdb0-c2db-46ee-bd87-b306dad3199b,precedent_created,a9e5e811-1a15-4c68-be82-faa5ce05bc24,"{""case_number"":""TAT No. 008 of 2023""}",2026-07-04 15:46:05.396627+00
494bcf7f-eda1-4dfd-842d-3a45262066e2,precedent_created,a9e5e811-1a15-4c68-be82-faa5ce05bc24,"{""case_number"":""""}",2026-07-04 15:22:33.019728+00
4e9f2ea5-20f2-4463-bc08-dc9cc2a5417e,precedent_created,a9e5e811-1a15-4c68-be82-faa5ce05bc24,"{""case_number"":""TAT APPLICATION NO. 207 OF 2023""}",2026-07-04 16:22:49.361563+00
4f157430-2230-42f1-956e-4ad8ac8a3bca,course_updated,a9e5e811-1a15-4c68-be82-faa5ce05bc24,"{""title"":""TAT Appeals: Process & Strategy"",""course_id"":2}",2026-07-04 15:08:11.028585+00
50fca810-3309-410a-b7c5-f0bccc8ea757,precedent_created,a9e5e811-1a15-4c68-be82-faa5ce05bc24,"{""case_number"":""TAT APPLICATION NO. 242 OF 2022""}",2026-07-04 22:05:38.926302+00
541a9d45-186f-4808-acfb-112887760488,precedent_created,a9e5e811-1a15-4c68-be82-faa5ce05bc24,"{""case_number"":""TAT No. 182 of 2024""}",2026-07-04 16:16:51.121735+00
54f0beda-54c9-4dd0-9590-0afbd7224329,precedent_created,2659af7a-7132-426d-a1fb-a3fbe5a12848,"{""case_number"":""APPLICATION NO. 73 Of 2026""}",2026-07-04 14:53:44.775604+00
56e7b2c0-3ef1-4a24-be4a-06d1a01a4968,precedent_created,a9e5e811-1a15-4c68-be82-faa5ce05bc24,"{""case_number"":""TAT APPLICATION NO. 63 OF 2024""}",2026-07-06 11:21:11.345902+00
5b38f3e9-564d-412a-b05e-d1c69276b548,precedent_created,a9e5e811-1a15-4c68-be82-faa5ce05bc24,"{""case_number"":""TAT APPLICATION NO. 183 OF 2024""}",2026-07-04 20:04:11.256718+00
5cab29ce-faeb-4a29-9b04-a9da3dbc47c8,user_deleted,2659af7a-7132-426d-a1fb-a3fbe5a12848,"{""email"":""princefattahkent@gmail.com"",""user_id"":""67c34b59-ac3e-487a-9601-712af19c14f4""}",2026-06-20 10:26:48.810701+00
5ecc16fb-f4cd-4aa1-8a2b-0943d67b9cdc,precedent_created,a9e5e811-1a15-4c68-be82-faa5ce05bc24,"{""case_number"":""APPLICATION NO. 29 OF 2024""}",2026-07-04 15:46:38.955816+00
60fe818e-f586-4630-b9d3-a0b8c13fcce5,precedent_created,a9e5e811-1a15-4c68-be82-faa5ce05bc24,"{""case_number"":""APPLICATION NO. 249 OF 2022""}",2026-07-04 16:00:47.986649+00
630e262b-6814-4f7e-b9b3-7f4eaee474b2,precedent_created,a9e5e811-1a15-4c68-be82-faa5ce05bc24,"{""case_number"":""TAT APPLICATION NO. 81 OF 2024""}",2026-07-04 20:21:13.851517+00
6509cc14-3d3a-4b07-83f4-160a709ee369,precedent_created,a9e5e811-1a15-4c68-be82-faa5ce05bc24,"{""case_number"":""APPLICATIONS NO. 139, 144, 240, 270 & 330, 274, 304, 312, 332, 342, 380 OF 2024""}",2026-07-04 16:23:53.314577+00
67506740-b261-4f5e-bf2e-2ff9f19c4566,precedent_created,a9e5e811-1a15-4c68-be82-faa5ce05bc24,"{""case_number"":""TAT APPLICATION NO. 238 OF 2024""}",2026-07-04 16:45:29.985566+00
6b2d300a-38a1-4984-84e1-108792bf7ea4,precedent_created,a9e5e811-1a15-4c68-be82-faa5ce05bc24,"{""case_number"":""TAT No. 063 of 2023""}",2026-07-04 15:21:34.912651+00
6c62e450-f923-4d59-8c06-56339867c93b,precedent_created,a9e5e811-1a15-4c68-be82-faa5ce05bc24,"{""case_number"":""TAT No. 220 of 2025""}",2026-07-06 18:16:08.379965+00
6c9cc418-27db-463d-b6b1-6915c5e200d1,precedent_created,a9e5e811-1a15-4c68-be82-faa5ce05bc24,"{""case_number"":""TAT No. 021 of 2025""}",2026-07-04 20:10:24.504086+00
6cb1f6d4-b541-4aed-b798-cae64099fb49,precedent_created,a9e5e811-1a15-4c68-be82-faa5ce05bc24,"{""case_number"":""MISCELLANEOUS APPLICATION NO.213 OF 2025 (ARISING FROM TAT APPLICATIONS NO 169 OF 2024)""}",2026-07-06 18:05:07.717139+00
70fe95e5-3263-4f97-a4a5-3e5fdcb96831,precedent_deleted,a9e5e811-1a15-4c68-be82-faa5ce05bc24,"{""case_number"":"""",""precedent_id"":""fc64b353-fdfe-4e96-9de7-c4ef7d31deb7""}",2026-07-04 15:45:02.749438+00
714073b5-b9f1-4b63-a412-3f68149cc810,precedent_created,2659af7a-7132-426d-a1fb-a3fbe5a12848,"{""case_number"":""APPLICATION NO. 73 Of 2026""}",2026-07-04 15:02:50.600626+00
78262304-d4c1-46c8-9ab0-e9d3a1c59e76,precedent_created,a9e5e811-1a15-4c68-be82-faa5ce05bc24,"{""case_number"":""APPLICATION NO. 188 OF 2024""}",2026-07-04 20:25:54.443196+00
78dcb2a6-d16c-4087-afb1-00effe516bec,precedent_created,a9e5e811-1a15-4c68-be82-faa5ce05bc24,"{""case_number"":""TAT No. 228 of 2022""}",2026-07-04 15:18:21.517291+00
80906da1-7380-4eb2-b885-5ac85bded03d,precedent_created,a9e5e811-1a15-4c68-be82-faa5ce05bc24,"{""case_number"":""TAT APPLICATION NO. 12 OF 2024""}",2026-07-04 21:39:36.572116+00
82eae7a2-a3f9-4dda-bb91-3f0190f65eb8,precedent_created,a9e5e811-1a15-4c68-be82-faa5ce05bc24,"{""case_number"":""TAT No. 59 of 2023""}",2026-07-04 16:44:38.171497+00
88482f27-f744-44c1-b7ea-c32d382a4878,precedent_created,a9e5e811-1a15-4c68-be82-faa5ce05bc24,"{""case_number"":""TAT APPLICATION NO. 219 OF 2023""}",2026-07-04 19:59:55.171648+00
896e80f2-d806-4a5f-93d5-fce1ef1924bc,precedent_created,a9e5e811-1a15-4c68-be82-faa5ce05bc24,"{""case_number"":""TAT No. 170 of 2023""}",2026-07-04 16:09:06.020298+00
8b52c898-d35f-45ea-923d-80008d7064ab,precedent_created,a9e5e811-1a15-4c68-be82-faa5ce05bc24,"{""case_number"":""TAT No. 378 of 2024""}",2026-07-04 20:19:41.970962+00
8d8b3695-e914-4da2-883a-d74ff4bd6259,user_updated,a9e5e811-1a15-4c68-be82-faa5ce05bc24,"{""user_id"":""a9e5e811-1a15-4c68-be82-faa5ce05bc24"",""new_plan"":""professional"",""new_role"":""Admin""}",2026-07-04 20:32:52.849619+00
914dd381-237a-4080-986d-f63634fb1a1b,precedent_created,a9e5e811-1a15-4c68-be82-faa5ce05bc24,"{""case_number"":""TAT APPLICATION NO. 164 OF 2022""}",2026-07-04 16:16:08.000132+00
9c72e896-dfed-4fc6-ab10-c1ed5cfaaf91,precedent_created,a9e5e811-1a15-4c68-be82-faa5ce05bc24,"{""case_number"":""TAT APPLICATION NO. 131 OF 2022""}",2026-07-04 20:03:37.67493+00
a1c0af30-c314-4f3c-918d-888fbd6f75e2,precedent_created,a9e5e811-1a15-4c68-be82-faa5ce05bc24,"{""case_number"":""APPLICATION NO. 348 OF 2024""}",2026-07-04 20:22:03.606616+00
a22e771e-7f7d-4e90-912c-121cb7258873,precedent_created,a9e5e811-1a15-4c68-be82-faa5ce05bc24,"{""case_number"":""TAT APPLICATION NO. 293 OF 2024""}",2026-07-04 21:40:32.380157+00
a47bf9dd-9132-4892-9561-3e9efa2fc627,precedent_created,a9e5e811-1a15-4c68-be82-faa5ce05bc24,"{""case_number"":""APPLICATION NO. 82 OF 2023""}",2026-07-04 21:33:44.627306+00
abb16ab2-5c26-4fc8-bf4a-86face242dca,precedent_deleted,2659af7a-7132-426d-a1fb-a3fbe5a12848,"{""case_number"":""APPLICATION NO. 73 Of 2026"",""precedent_id"":""dada4fe4-9fc1-4927-965d-c5b358f30864""}",2026-07-04 15:12:27.615878+00
ac2b8233-cf41-4cc9-8b70-c72132d22cc8,precedent_created,a9e5e811-1a15-4c68-be82-faa5ce05bc24,"{""case_number"":""TAT No. 107 of 2023""}",2026-07-04 16:55:36.661006+00
ad806a1b-9381-408b-82d8-d76656f5bffc,precedent_created,a9e5e811-1a15-4c68-be82-faa5ce05bc24,"{""case_number"":""TAT APPLICATION NO. 16 OF 2024""}",2026-07-04 15:22:14.142622+00
aefd16d9-d502-4fd2-9a8b-084ef3435e7c,user_updated,a9e5e811-1a15-4c68-be82-faa5ce05bc24,"{""user_id"":""a9e5e811-1a15-4c68-be82-faa5ce05bc24"",""new_plan"":""free"",""new_role"":""Admin""}",2026-07-04 20:34:00.769809+00
af94b799-c72e-4838-bdf2-4fd66b08e3fd,precedent_created,a9e5e811-1a15-4c68-be82-faa5ce05bc24,"{""case_number"":""TAT APPLICATION NO. 103 OF 2022""}",2026-07-04 15:24:41.381626+00
b12604ee-d84d-4df8-85d2-9f51fb42a217,course_updated,a9e5e811-1a15-4c68-be82-faa5ce05bc24,"{""title"":""URA eFRIS Mastery"",""course_id"":3}",2026-07-04 15:33:41.94555+00
b332867b-4d4f-4221-8c40-13bc1395101d,precedent_created,a9e5e811-1a15-4c68-be82-faa5ce05bc24,"{""case_number"":""TAT APPLICATION NO. 90 OF 2025""}",2026-07-04 21:31:52.486068+00
b3f8042c-f1c3-4b72-9ce1-f5a69358351b,precedent_created,a9e5e811-1a15-4c68-be82-faa5ce05bc24,"{""case_number"":""APPLICATION NO. 179 OF 2025.""}",2026-07-04 15:54:11.157472+00
b67be1bf-0edf-4e62-8a89-b8016a979b45,precedent_created,a9e5e811-1a15-4c68-be82-faa5ce05bc24,"{""case_number"":""TAT APPLICATION NO. 36 OF 2025""}",2026-07-04 16:52:37.804587+00
b7f41cad-32fa-49a9-ba97-08df0e42e673,precedent_created,a9e5e811-1a15-4c68-be82-faa5ce05bc24,"{""case_number"":""APPLICATION NO. 282 OF 2025""}",2026-07-04 21:34:30.803543+00
b806cb61-7554-44e9-92c3-c1703f97a5b7,precedent_created,a9e5e811-1a15-4c68-be82-faa5ce05bc24,"{""case_number"":""TAT APPLICATION NO. 69 OF 2023""}",2026-07-04 15:35:04.876913+00
b8a462d7-5084-4dcf-9735-7fab59a6fff3,precedent_created,a9e5e811-1a15-4c68-be82-faa5ce05bc24,"{""case_number"":""TAT APPLICATION NO. 94 OF 2025""}",2026-07-04 16:05:45.139008+00
bb0bcd7b-e8e9-4e59-ac2f-01a00c2adb10,precedent_created,a9e5e811-1a15-4c68-be82-faa5ce05bc24,"{""case_number"":""APPLICATION NO. 359 OF 2024""}",2026-07-04 21:28:02.747735+00
be408cc9-67e8-40c1-89c5-f537d19656c7,user_updated,a9e5e811-1a15-4c68-be82-faa5ce05bc24,"{""user_id"":""2659af7a-7132-426d-a1fb-a3fbe5a12848"",""new_plan"":""free"",""new_role"":""Admin""}",2026-07-04 20:34:07.230075+00
c47eaef8-40b3-4f07-92fb-08d91a06d6fb,precedent_created,a9e5e811-1a15-4c68-be82-faa5ce05bc24,"{""case_number"":""TAT APPLICATION NO. 130 OF 2025""}",2026-07-04 20:20:33.795278+00
c6039252-e4ac-4b3f-9e8b-921945b704d7,precedent_created,a9e5e811-1a15-4c68-be82-faa5ce05bc24,"{""case_number"":""APPLICATION NO. 40 OF 2023""}",2026-07-06 18:05:47.746829+00
c6d8f0b0-7fc2-4f57-b3cd-08b6747a7077,precedent_created,a9e5e811-1a15-4c68-be82-faa5ce05bc24,"{""case_number"":""TAT No. 259 of 2024""}",2026-07-04 16:50:38.153893+00
c7578853-e8bb-4f5b-83d1-a2fc77f7c9b1,precedent_created,a9e5e811-1a15-4c68-be82-faa5ce05bc24,"{""case_number"":""MISCELLANEOUS APPLICATION NO. 33 OF 2025""}",2026-07-06 18:17:20.40985+00
c7bb15d0-1097-49c3-843a-5e30ce32abc5,precedent_created,a9e5e811-1a15-4c68-be82-faa5ce05bc24,"{""case_number"":""TAT APPLICATION NO. 73 OF 2023""}",2026-07-04 15:55:01.578752+00
c846353a-615f-46f5-87cc-c880cda52141,precedent_created,2659af7a-7132-426d-a1fb-a3fbe5a12848,"{""case_number"":""APPLICATION NO. 73 Of 2026""}",2026-07-04 08:42:54.246299+00
c95623de-549e-47ca-b59f-8a78d692550d,precedent_created,a9e5e811-1a15-4c68-be82-faa5ce05bc24,"{""case_number"":""TAT APPLICATION NO. 111 OF 2024""}",2026-07-04 14:32:24.679115+00
ca94109d-4bd8-4ae6-84f2-f8233b6208c5,site_settings_updated,2659af7a-7132-426d-a1fb-a3fbe5a12848,{},2026-07-06 13:03:08.700891+00
cdb86678-7d02-4c2f-9eeb-6ca1d3323a7e,precedent_created,a9e5e811-1a15-4c68-be82-faa5ce05bc24,"{""case_number"":""HCT-00-CV-CS-0352-2020""}",2026-07-18 17:01:16.185044+00
d034ccb1-e793-4d8f-bdbb-79ee6b9fb952,precedent_created,a9e5e811-1a15-4c68-be82-faa5ce05bc24,"{""case_number"":""TAT No. 60 of 2020""}",2026-07-07 17:03:15.047864+00
d1878e35-e889-4084-b1a8-70612d2acbf1,precedent_created,a9e5e811-1a15-4c68-be82-faa5ce05bc24,"{""case_number"":""MISC APPLICATION NO. 06 OF 2025""}",2026-07-06 17:57:45.426755+00
d196c6b0-70a0-44e2-a7ea-d1416dc2d4cd,precedent_created,a9e5e811-1a15-4c68-be82-faa5ce05bc24,"{""case_number"":""TAT No. 36 of 2024""}",2026-07-04 21:38:40.372814+00
d1f4a6ef-9dff-47a2-89f2-21a91e61685e,precedent_created,a9e5e811-1a15-4c68-be82-faa5ce05bc24,"{""case_number"":""TAT No. 261 of 2022""}",2026-07-06 11:19:26.555877+00
d29db119-a3bd-4ce3-a203-a96d8bf20a2c,precedent_created,a9e5e811-1a15-4c68-be82-faa5ce05bc24,"{""case_number"":""APPLICATION NO. 218 OF 2022""}",2026-07-04 16:17:38.290911+00
d4acc59a-b47e-45cd-abc6-134705f77c74,precedent_created,a9e5e811-1a15-4c68-be82-faa5ce05bc24,"{""case_number"":""TAT No. 41 of 2023""}",2026-07-04 16:43:42.963454+00
d4f07099-9edd-4fc1-8c80-24bfd5561aca,precedent_created,a9e5e811-1a15-4c68-be82-faa5ce05bc24,"{""case_number"":""APPLICATION NO. 215 OF 2024""}",2026-07-04 21:36:46.579265+00
d5290667-a18a-418b-842b-c714e8b45e14,precedent_created,a9e5e811-1a15-4c68-be82-faa5ce05bc24,"{""case_number"":""TAT APLICATION NO. 41 OF 2024""}",2026-07-04 20:27:24.023116+00
d674400b-feee-4fb6-8c45-4ca7f25d07f2,precedent_created,a9e5e811-1a15-4c68-be82-faa5ce05bc24,"{""case_number"":""MISC. APPLICATION NO. 181 OF 2023""}",2026-07-06 18:02:47.652327+00
d7286ca2-5232-4c86-8019-91ca37b5813c,precedent_created,a9e5e811-1a15-4c68-be82-faa5ce05bc24,"{""case_number"":""TAT No. 17 of 2024""}",2026-07-06 11:20:08.873904+00
d7d10c12-78c8-443a-9faa-d68e5e7768eb,precedent_created,a9e5e811-1a15-4c68-be82-faa5ce05bc24,"{""case_number"":""TAT APPLICATION NO. 08 OF 2024""}",2026-07-04 15:17:48.463624+00
da48774c-9529-4b8f-8335-c28c98465a7a,precedent_created,a9e5e811-1a15-4c68-be82-faa5ce05bc24,"{""case_number"":""TAT APPLICATION NO. 004 OF 2025""}",2026-07-04 15:23:13.270784+00
de5f7a90-0afd-4b23-818e-053f1e3d402d,precedent_created,a9e5e811-1a15-4c68-be82-faa5ce05bc24,"{""case_number"":""MISCELLANEOUS CAUSE NO. 84 OF 2025""}",2026-07-06 18:14:45.149535+00
e2077a9c-4a1f-484c-8aa1-48ce62d2c63c,precedent_created,a9e5e811-1a15-4c68-be82-faa5ce05bc24,"{""case_number"":""TAT No. 89 of 2023""}",2026-07-04 16:56:29.113726+00
e31b0b43-e9a0-4894-9d87-7dfcb764a275,precedent_created,a9e5e811-1a15-4c68-be82-faa5ce05bc24,"{""case_number"":""TAT APPLICATION NO. 276 OF 2025""}",2026-07-06 11:20:44.928801+00
e4452e21-01bc-4af5-ba9b-97e1cc16d9f4,precedent_created,a9e5e811-1a15-4c68-be82-faa5ce05bc24,"{""case_number"":""TAT No. 197 of 2023""}",2026-07-04 15:53:04.518717+00
e60d22ab-eb64-4a9c-a2af-12329c05f541,precedent_created,a9e5e811-1a15-4c68-be82-faa5ce05bc24,"{""case_number"":""APPLICATION NO. 145 OF 2025""}",2026-07-04 20:18:29.997418+00
e8667619-022b-4834-af7f-6e002d290c2b,precedent_created,a9e5e811-1a15-4c68-be82-faa5ce05bc24,"{""case_number"":""TAT No. 139 OF 2023""}",2026-07-06 17:56:16.913427+00
e9773c2e-5e22-4789-aea7-b4d0a7577218,precedent_created,a9e5e811-1a15-4c68-be82-faa5ce05bc24,"{""case_number"":""TAT No. 103 of 2025""}",2026-07-06 18:04:33.354732+00
f2adce2c-1208-4401-ab1f-0c7131f93e82,precedent_deleted,2659af7a-7132-426d-a1fb-a3fbe5a12848,"{""case_number"":""APPLICATION NO. 73 Of 2026"",""precedent_id"":""da966f8d-793c-42bd-9340-643fe429e137""}",2026-07-04 15:01:15.656763+00
f69688bc-9118-43a1-8126-94cde7f859ea,precedent_created,a9e5e811-1a15-4c68-be82-faa5ce05bc24,"{""case_number"":""APPLICATION NO.91 OF 2023""}",2026-07-04 15:49:18.868852+00
f9ec731b-22a8-4376-9a2e-0a73d2be3345,precedent_created,a9e5e811-1a15-4c68-be82-faa5ce05bc24,"{""case_number"":""MISC APPLICATIONS NO. 149, 151, 153,155 (ARISING FROM TAT APPLICATIONS NO. 189, 194, 195, 193)""}",2026-07-06 18:04:00.260736+00
fb487aaf-fea9-422e-b19b-f5ae2c841299,user_updated,a9e5e811-1a15-4c68-be82-faa5ce05bc24,"{""user_id"":""a9e5e811-1a15-4c68-be82-faa5ce05bc24"",""new_plan"":""free"",""new_role"":""Admin""}",2026-07-04 13:58:52.809193+00
fbaa7803-ed56-4e5d-9c4b-5f0e452c8116,precedent_created,a9e5e811-1a15-4c68-be82-faa5ce05bc24,"{""case_number"":""TAT No. 028 OF 2025""}",2026-07-04 22:06:38.252937+00
fc019047-b6d4-45e3-88be-2656106faaa3,site_settings_updated,a9e5e811-1a15-4c68-be82-faa5ce05bc24,{},2026-07-04 15:16:55.221044+00
fd0ed9ae-f400-41ad-894a-9d6b6ddd3af9,user_updated,2659af7a-7132-426d-a1fb-a3fbe5a12848,"{""user_id"":""2659af7a-7132-426d-a1fb-a3fbe5a12848"",""new_plan"":""professional"",""new_role"":""Admin""}",2026-06-20 08:14:34.01615+00"""

USERS_RAW = """id,email,full_name,role,plan,created_at,last_login
0ef2a671-722d-465b-bb01-6baba1c94690,nexoshealthai@gmail.com,Nexos,Tax Consultant,free,2026-07-07 08:22:27.659493+00,
2659af7a-7132-426d-a1fb-a3fbe5a12848,princefredkent@gmail.com,Fred Kent,Admin,free,2026-06-15 06:23:29.093788+00,
46b4e1df-8bee-4dee-bfcc-24b8614999fd,ec632145@gmail.com,Eric,Tax Consultant,free,2026-10-07 19:31:02.448999+00,
5882774d-39e0-4b2e-a7a1-90551ebbd4dd,test69@gmail.com,Test 69,Tax Consultant,free,2026-07-09 07:31:27.301119+00,
67c34b59-ac3e-487a-9601-712af19c14f4,princefattahkent@gmail.com,Tester,Tax Consultant,free,2026-06-20 06:30:22.183942+00,
8f1022eb-171c-4845-9910-f097fe54657d,geraldmuwanguzi50@gmail.com,Muwanguzi Gerald,Tax Consultant,free,2026-07-11 18:00:15.555553+00,
a9e5e811-1a15-4c68-be82-faa5ce05bc24,bakulumpagieric99@gmail.com,ERIC,Admin,free,2026-07-04 13:51:00.943779+00,
f8174d44-d81a-4e70-9f4b-64744f969d09,taxwiseplatform@gmail.com,Tester123,Tax Consultant,free,2026-07-04 11:36:52.408438+00,"""

SITE_SETTINGS_RAW = """key,value
calc_corporate_rate,30
calc_import_rate,43
calc_paye_rate,12
calc_vat_rate,18
calc_wht_rate,6
hero_badge_text,Built for Uganda Tax & Customs Professionals
hero_subtitle,"AI case analysis, TAT precedent research, live tax & import calculators, and compliance checking tools — purpose-built for Uganda's tax ecosystem."
hero_title_line1,The tax intelligence
hero_title_line2,platform your practice
hero_title_line3,actually needs
pesapal_ipn_id_production,556a236c-3976-40da-8305-da35dcc97ba4
stat_calculators,6
stat_cases,"1,200+"
stat_practitioners,350+
stat_time_saved,85%
topbar_email,hello@taxwise.cloud
topbar_text,"🇺🇬 Engineered for Uganda's Tax & Customs Ecosystem" """

USER_PROGRESS_RAW = """id,user_id,course_id,progress,completed_lessons,completed_at,created_at
14360c7a-eb63-444f-92c6-9c5c2880e886,2659af7a-7132-426d-a1fb-a3fbe5a12848,1,0,[],,2026-06-15 07:49:06.881828+00
7f172271-2a1d-42ac-95b6-e9984d624d93,a9e5e811-1a15-4c68-be82-faa5ce05bc24,2,0,[],,2026-07-04 16:02:00.149399+00"""

COMPLIANCE_CHECKS_RAW = """id,user_id,type,responses,risk_report,score,created_at
1cbdf1d3-142f-4eb4-812c-4d9b5715557d,a9e5e811-1a15-4c68-be82-faa5ce05bc24,efris,{},"# EFRIS Compliance Risk Report\n\n## Overall Risk Assessment\n\n**Current Compliance Score: 0%**\n\nThe current compliance score of 0% indicates a **critical level of non-compliance** with Uganda Revenue Authority eFRIS requirements.",0,2026-07-15 10:58:30.235823+00
e0aa48fc-971c-472c-8ef8-af2402bc7af3,a9e5e811-1a15-4c68-be82-faa5ce05bc24,efris,{},"## Risk Report: eFRIS Compliance Assessment\n\n**Date:** October 26, 2023\n\n---\n\n### 1. Overall Risk Assessment\n\n**Current Compliance Score:** 0%\n**Threat Level:** Critical\n\nThe current compliance score of 0% indicates a complete and systemic failure to adhere to the Electronic Fiscal Receipting and Invoicing System (eFRIS) requirements as mandated by the Uganda Revenue Authority",0,2026-07-06 07:12:43.790615+00"""

print("Writing parser...")
