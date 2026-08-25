# Toward an Embodied Learning Environment for Teaching Geometry

**Andreas Papasalouros¹ and Antonios Kontogiannis²**

¹Associate Professor, Department of Mathematics, University of the Aegean
²PhD Candidate, Department of Mathematics, University of the Aegean

## Abstract

This chapter presents a technology-enhanced environment designed to support embodied learning activities in geometry by leveraging recent advances in computer vision and artificial intelligence. The design of the environment is grounded in theories of embodied and enactive cognition, which emphasize that learning emerges through active bodily engagement, movement, and interaction with the physical environment. Building upon these theoretical foundations, the chapter introduces a collaborative smart classroom platform that enables students to construct and explore geometric concepts through coordinated full-body activity.

Within the proposed environment, students' positions are continuously tracked in real time and mapped onto a shared geometric representation displayed on a classroom screen. Each participant embodies a geometric object—typically a point—whose movement in the physical space produces corresponding transformations within an idealized geometric workspace. Unlike conventional geometry instruction, where students primarily observe or manipulate virtual representations, the proposed approach enables learners to collaboratively construct and transform geometric configurations through coordinated movement, communication, and interaction. The teacher orchestrates each activity by defining geometric objects and constraints, while students collectively manipulate these objects through their physical actions.

The environment has been designed to require only inexpensive and widely available classroom equipment, consisting of a standard camera, a computer, and a projector or large display. Real-time interaction is supported through deep-learning-based multi-object detection and tracking, allowing accurate localization and persistent identification of multiple participants throughout the learning activity. The software has been implemented as a reusable framework that can be readily adapted to a variety of geometry applications and, more generally, to other educational domains where tracking learners' positions and interactions can support meaningful learning experiences.

A formative pilot evaluation was conducted during a two-hour session involving three students aged 10–14. Four collaborative geometry activities were implemented, including navigating predefined geometric locations, constructing symmetric points, and collaboratively forming equilateral and right triangles. The results demonstrated that the proposed environment provides sufficient technical accuracy and responsiveness to support embodied geometry activities. Students successfully completed all tasks, remained actively engaged throughout the session, and described the experience as more interesting and less monotonous than conventional classroom instruction.

The pilot study also identified several directions for further development. These include reducing positional jitter caused by natural body movements, improving participant re-identification following temporary occlusions, providing richer instructional scaffolding for complex collaborative tasks, and incorporating immediate visual feedback to support successful task completion. Future work will focus on expanding the range of curriculum-aligned activities, conducting larger-scale classroom studies, and investigating additional interaction modalities, such as gesture recognition. Beyond this specific application, the proposed environment illustrates how contemporary computer vision technologies can facilitate the implementation of embodied learning in ordinary classrooms through a low-cost, reusable, and easily deployable platform.

**Keywords:** embodied learning; geometry education; smart classroom; collaborative learning; computer vision; mathematics education.

## 2. Introduction

Theories of embodied and enactive cognition (Varela et al., 1991; Tsakiri, 2010) extend the constructivist view of learning by arguing that knowledge is not acquired solely through observation or information transfer but emerges through learners’ active engagement with their environment. These perspectives emphasize that cognition is fundamentally grounded in bodily action and situated interaction, highlighting the importance of movement, gesture, and physical participation in authentic learning contexts.

Within mathematics education, embodied cognition has received considerable attention over the past two decades. A growing body of research argues that mathematical thinking is inherently embodied (Alibali & Nathan, 2012; Papert, 1991), with even highly abstract mathematical concepts being rooted in learners’ sensorimotor experiences and their interactions with the physical world (Lakoff & Núñez, 2000). Consequently, learning mathematics is increasingly viewed not merely as the manipulation of abstract symbolic representations but as a process that is closely connected to perception, action, and spatial experience.

These theoretical developments have stimulated substantial research on embodied learning within STEM education (Junus et al., 2024). In parallel, systematic design principles have been proposed for developing embodied learning activities, particularly in mathematics education, where physical interaction is intentionally integrated with conceptual understanding (Abrahamson et al., 2020; Smith & Walkington, 2019).

From the perspective of embodied cognition, learning environments should encourage learners to actively participate in the systems they seek to understand rather than observe them from a detached standpoint. This principle has motivated the development of participatory simulations and role-playing learning environments (Colella, 2000; Resnick & Wilensky, 1998), in which students become integral components of the phenomena or mathematical structures under investigation. Such environments are frequently implemented within smart classrooms (Lui & Slotta, 2013; Tissenbaum & Slotta, 2014), where sensing technologies, networked devices, and large shared displays enable students to interact with one another while jointly constructing knowledge through physical activity.

A defining characteristic of these environments is that learners engage through movement within a shared physical space rather than remaining seated in front of individual computers. At the same time, collaboration emerges naturally through face-to-face communication, coordinated bodily actions, and shared interaction with digital representations. This combination of physical participation, social interaction, and technological support provides a promising foundation for designing learning experiences that bridge abstract mathematical concepts with students' embodied experiences.

Building upon these principles, this chapter presents an embodied learning environment specifically designed to support geometry education through collaborative full-body interaction. Unlike existing systems that often rely on specialized sensing equipment, the proposed environment employs only a conventional camera together with recent computer vision and artificial intelligence techniques to provide accurate real-time tracking of multiple students. The system has been designed as a reusable software framework capable of supporting a wide range of collaborative geometry activities while remaining inexpensive, easily deployable, and suitable for ordinary classroom settings.

## 3. Embodied Learning, Tracking Technologies, and Related Learning Environments

Recent advances in digital technologies have significantly expanded the possibilities for implementing embodied learning across a wide range of educational settings. Contemporary embodied learning environments increasingly integrate technologies such as virtual and augmented reality, motion capture, depth sensors, computer vision, and artificial intelligence to establish a direct relationship between learners' physical actions and digital representations (Abrahamson et al., 2023). Within these environments, students' movements and gestures are continuously monitored and interpreted in real time, allowing the system to provide immediate visual or multimodal feedback that strengthens the connection between bodily action and conceptual understanding.

In mathematics education, these technologies allow physical movement to acquire explicit mathematical meaning. Rather than functioning merely as interaction techniques, gestures and bodily movements become representations of mathematical objects and relationships, enabling learners to experience abstract concepts through sensorimotor activity (Smith & Walkington, 2019). This close coupling between action and representation has been shown to facilitate conceptual understanding while increasing learner engagement.

A considerable number of embodied learning environments have been developed to support mathematics and science education. One of the earliest examples is **SMALLab Learning** (Birchfield et al., 2009), which combines motion-tracking technologies with large-scale immersive visualizations, allowing students to explore mathematical and scientific concepts through full-body interaction. The **Mathematical Imagery Trainer (MIT)** (Abrahamson & Trninic, 2015) enables learners to manipulate mathematical representations through carefully designed gestures, providing immediate visual feedback that supports the gradual construction of mathematical meaning.

More recent environments have incorporated mixed reality and computer vision technologies. **Mathland** (Khan et al., 2018) employs Microsoft HoloLens to support embodied interaction with mathematical concepts in immersive mixed-reality settings, while **Leap Motion Math** (Na & Sung, 2025) enables students to manipulate geometric objects through natural hand and finger movements using Leap Motion sensors in combination with augmented reality techniques.

Beyond commercially available platforms such as Kinect and Wii, researchers have also developed specialized embodied learning systems tailored to particular educational objectives. For example, **Polymichanon** (Kynigos et al., 2010) supports precise motion tracking and the mapping of learners' movements onto mathematical representations. A consistent finding across these studies is that guided bodily interaction can promote deeper conceptual understanding of mathematical relationships (Abrahamson et al., 2023), improve spatial reasoning through immersive environments (Kynigos et al., 2020), and enhance participation and confidence among students with special educational needs (Kourakli et al., 2017).

Overall, the evaluation of these embodied learning environments suggests that meaningful bodily interaction can enhance conceptual understanding, increase learner motivation, and promote collaborative forms of learning. Nevertheless, many existing systems depend on specialized hardware, including depth cameras, wearable sensors, dedicated controllers, or immersive visualization equipment, limiting their scalability and adoption in everyday classroom settings.

The environment proposed in this study follows a different design philosophy. Instead of relying on specialized sensing technologies, it uses a single conventional camera together with state-of-the-art deep-learning-based computer vision techniques to detect, identify, and track multiple students in real time. This substantially reduces equipment requirements while preserving the core affordances necessary to support collaborative embodied learning activities. Consequently, the proposed environment offers a practical and cost-effective solution that can be deployed in ordinary school classrooms without requiring specialized infrastructure.

## 4. Proposed Environment for Embodied Learning in Mathematics

The environment presented in this chapter has been designed to support collaborative embodied learning activities in geometry through the real-time tracking of students' positions within the physical classroom. The primary objective is not merely to provide a novel interaction technology, but to establish a research platform for designing, implementing, and evaluating embodied learning activities that promote conceptual understanding through physical participation and collaboration.

Geometry provides an especially suitable context for this approach. Although students are generally able to recognize common geometric figures, numerous studies have shown that they often experience difficulties in understanding their properties and the relationships among geometric objects (Sarama & Clements, 2019). Embodied learning offers an alternative perspective by allowing abstract geometric concepts to emerge through learners' bodily actions rather than through symbolic manipulation alone.

Within the proposed environment, each participant embodies a geometric object, typically a point within a geometric construction. Students move freely inside the physical classroom, while their positions are continuously detected and transformed into corresponding coordinates within an idealized geometric workspace. These representations are displayed on a shared classroom screen, allowing all participants to observe both their own embodied representation and those of their classmates in real time.

Following the principles of participatory simulations and educational role-playing (Colella, 2000; Resnick & Wilensky, 1998), students become active components of the mathematical construction itself rather than external observers. As participants move, the geometric objects they represent move accordingly, together with all dependent objects within the construction, in a manner similar to a dynamic geometry environment. Consequently, students experience geometric relationships not only through visual observation but also through direct physical interaction.

The teacher orchestrates each activity by defining the geometric objects and constraints that frame students' actions. For example, the teacher may create a line of symmetry, specify the vertices of a geometric figure, or establish other construction rules that students must satisfy collaboratively through coordinated movement. In this way, the environment combines the flexibility of dynamic geometry software with the pedagogical affordances of embodied participation.

The design of the environment aims to strengthen students' sense of presence and encourage collaboration throughout the learning process. Whereas conventional mathematics instruction often positions learners as detached observers manipulating abstract representations, embodied learning places students at the centre of the activity, allowing them to experience mathematical ideas from a first-person perspective (Mikropoulos, 2006; Smith, 2018). By identifying themselves with the geometric objects they represent—or, in Papert's (1991) terms, by *becoming* those objects—students actively participate in the formation and transformation of geometric constructions while simultaneously observing both the shared digital representation and the physical actions of their peers.

This embodied participation supports communication, joint problem solving, and the negotiation of meaning among group members. Students coordinate their movements through face-to-face interaction while collectively pursuing a common geometric objective. Such collaboration not only promotes communication but also distributes the cognitive demands of complex tasks, allowing learners to focus on different aspects of the construction and thereby facilitating conceptual understanding (Smith & Walkington, 2019).

Accordingly, the proposed environment should be viewed not simply as a motion-tracking system, but as an embodied collaborative learning platform in which physical movement, social interaction, and dynamic geometric representations are integrated into a unified learning experience.

## 5. Pedagogical and Technical Affordances

The proposed environment has been designed to provide a set of affordances that support collaborative embodied learning activities while maintaining the simplicity required for deployment in ordinary classroom settings. These affordances arise from the integration of computer vision technologies with pedagogically informed interaction design.

### 5.1 Real-Time Multi-Participant Tracking

A fundamental affordance of the environment is the ability to accurately determine the positions of multiple students simultaneously and in real time. Continuous position tracking enables learners to interact naturally within the physical classroom while receiving immediate visual feedback through the shared geometric representation. This close temporal coupling between movement and visual representation strengthens the embodied connection between physical action and mathematical meaning.

### 5.2 Persistent Participant Identification

Beyond position tracking, the environment maintains the identity of each participant throughout the learning activity. Each student is continuously identified using visual appearance features, allowing the system to preserve the correspondence between a learner and the geometric object that he or she represents, even after temporary disappearance or re-entry into the interaction space. Persistent identification is essential for collaborative activities in which students remain responsible for specific geometric entities during the construction process.

### 5.3 Shared Visual Workspace

The environment provides a common visual representation of the activity through a projector or large classroom display. Students observe both their own positions and those of their classmates within the same geometric workspace, together with any additional information required by the activity. This shared representation establishes a common frame of reference that supports communication, coordination, and collaborative problem solving.

### 5.4 Teacher-Orchestrated Geometric Constraints

The teacher can define geometric objects and construction constraints that shape the collaborative activity. Examples include symmetry axes, line segments, circles, predefined vertices, or other geometric structures that students must collectively manipulate through their movements. Rather than controlling the activity directly, the teacher orchestrates the learning process by designing the mathematical situation within which students interact.

### 5.5 Low-Cost and Easily Deployable Infrastructure

A central design objective of the proposed environment is accessibility. The system requires only equipment that is already available in most schools—a conventional camera, a computer, and a projector or large display. Consequently, embodied learning activities can be implemented without specialized hardware such as depth sensors, wearable devices, or immersive virtual reality systems.

### 5.6 Reusability Beyond Geometry

Although the present implementation focuses on geometry education, the underlying software framework has been designed to support a considerably broader range of educational applications. Any learning activity that benefits from monitoring the positions, movements, or interactions of multiple participants can build upon the same technological infrastructure. Consequently, the proposed framework provides a reusable foundation for the development of embodied learning environments across different subject domains.

## 6. Implementation

The implementation of the proposed environment was driven by the technical requirements derived from the pedagogical objectives presented in the previous sections. In particular, the system had to support the accurate localization of multiple students, maintain their identities throughout the interaction, and provide real-time visual feedback with sufficiently low latency to preserve the embodied nature of the learning experience.

To satisfy these requirements, the environment employs a deep-learning-based multi-object tracking pipeline. Multi-object tracking (MOT) has recently attracted considerable attention in application domains such as intelligent transportation, sports analytics, robotics, and precision agriculture (Xu, 2023). The same technological advances provide an effective foundation for educational environments in which multiple learners interact simultaneously within a shared physical space.

The tracking pipeline consists of two complementary stages: object detection and object tracking. During the detection stage, the system identifies all people visible within the camera's field of view and estimates their locations in each video frame. Detection is performed using the YOLO object detection framework (Jocher et al., 2023), selected for its high detection accuracy and real-time performance.

The second stage associates the detected individuals across consecutive frames in order to preserve their identities throughout the learning activity. Following an extensive evaluation of several contemporary multi-object tracking algorithms, a DeepSORT-based implementation (Wojke et al., 2017) was selected as the most suitable solution for the requirements of the proposed environment. This approach combines motion prediction with appearance-based re-identification, allowing participants to retain consistent identities even during temporary interruptions in visual tracking.

The complete tracking pipeline operates continuously in real time. For every incoming video frame, the system detects the participants, updates their identities, estimates their positions within the interaction space, and transmits the resulting coordinates to the educational application. The application subsequently updates the shared geometric workspace, allowing students to observe the immediate consequences of their physical movements on the projected geometric construction.

The software has been developed as an open-source, reusable framework rather than as a single-purpose educational application. This design enables developers and researchers to implement different embodied learning scenarios while reusing the same tracking infrastructure. Although the present work focuses on geometry education, the framework is intended to support a much broader range of educational applications involving collaborative embodied interaction.

The software developed for this work is publicly available as open-source software through the Strobe project on GitHub. The framework has been designed to facilitate future extensions, including support for additional interaction techniques, alternative tracking algorithms, and new educational activities, while preserving a common software architecture for embodied learning applications.

## 7. Pilot Evaluation

### 7.1 Method

The proposed environment was evaluated through a formative pilot study following the principles of Learner-Centered Design (LCD) (Quintana et al., 2004). Rather than attempting to measure learning outcomes, the evaluation focused on examining the usability of the environment, the technical reliability of the tracking system, and its ability to support the intended embodied learning activities under realistic conditions.

The pilot study pursued four main objectives:

- to evaluate the technical reliability of the multi-student detection and tracking mechanism;
- to assess the usability and functionality of the environment during collaborative geometry activities;
- to investigate students' cognitive and collaborative engagement throughout the activities; and
- to identify design improvements for increasing the pedagogical effectiveness of the environment.

The evaluation was conducted during a two-hour session in May 2025 with three students aged 10, 12, and 14 years. Although the sample size was intentionally small, the purpose of the study was formative rather than summative, aiming to identify technical limitations and usability issues before conducting larger classroom evaluations.

The students completed four collaborative geometry activities designed according to the principles for embodied mathematics learning proposed by Smith and Walkington (2019).

**Activity 1 – Navigating the Vertices of a Square**

Each student individually moved successively among four predefined locations corresponding to the vertices of a square. The positions were physically marked within the interaction space rather than displayed on the projected geometric representation. Students remained stationary at each location until instructed by the facilitator to move to the next vertex.

**Activity 2 – Constructing Symmetric Points**

A vertical line representing an axis of symmetry was displayed on the shared screen. One student selected an arbitrary position within the interaction area, while a second student attempted to position themselves at the corresponding symmetric point with respect to the displayed axis.

**Activity 3 – Constructing an Equilateral Triangle**

Two students first established the endpoints of a line segment by remaining stationary. The third student then moved until the three embodied points formed an equilateral triangle. The activity was repeated several times while students alternated roles.

**Activity 4 – Constructing a Right Triangle**

The three students collaboratively formed a right triangle starting from arbitrary positions within the interaction space. The youngest participant was assigned the role of the vertex containing the right angle. As in the previous activity, students exchanged roles across successive trials.

### 7.2 Experimental Setting and Data Collection

The activities were facilitated by one of the authors, who provided the initial instructions and coordinated the progression of the tasks. Students were explicitly encouraged to communicate continuously with one another throughout the activities in order to support collaborative problem solving.

The evaluation was conducted in a 4 × 4 m indoor space. A single camera was mounted at a height of approximately 2.1 m above the floor, providing an oblique view of the interaction area. A geometric correction was applied to compensate for the camera perspective before mapping participants' positions onto the shared geometric workspace. The visual representation was projected on a 65-inch display.

Three complementary sources of data were collected during the evaluation:

1. **System logs**, containing the real-time coordinates of all participants throughout each activity.

2. **Video recordings**, used to analyse students' movements, collaboration patterns, engagement, communication, and interaction with the environment. Written parental consent was obtained for both data collection and the publication of photographs showing the participating students.

3. **Semi-structured interviews**, conducted immediately after the session, during which students reflected on the usability of the environment, their understanding of the mathematical concepts involved, and their overall learning experience.

The collected data were analysed qualitatively. Given that the environment is still under active development, the primary objective of the analysis was not to produce generalisable findings but rather to identify technical limitations, usability issues, and pedagogical design improvements that will inform future iterations of the system.

## 8. Results and Discussion

### 8.1 Technical Performance

The first objective of the pilot evaluation was to examine the technical reliability of the proposed environment. In particular, we evaluated the accuracy of participant localization and the consistency of multi-object identification throughout the collaborative activities.

Overall, the system demonstrated satisfactory performance for the intended educational scenarios. Position estimation proved sufficiently accurate to support all four geometry activities, while participant identities remained stable throughout the interaction whenever students remained within the camera's field of view. The average end-to-end system latency—including detection, tracking, and visualization—was approximately 85 ms, providing a sufficiently responsive interaction to preserve the embodied character of the activities. Performance measurements were obtained using a workstation equipped with an AMD Ryzen 7 3800X processor, 16 GB RAM, and an NVIDIA GeForce GTX 1660 graphics card with 6 GB of dedicated memory.

These results suggest that recent deep-learning-based tracking technologies can provide the responsiveness and reliability required for collaborative embodied learning activities without relying on specialized sensing equipment.

### 8.2 Students' Participation and Learning Experience

All participants successfully completed the four collaborative geometry activities. Throughout the evaluation, students remained actively engaged and collaborated effectively in achieving the objectives of each task.

The second activity, involving the construction of symmetric points, was completed easily by all participants, indicating that the embodied representation of geometric symmetry was readily understood. The third activity, which required the collaborative construction of an equilateral triangle, proved more challenging but was completed successfully after a limited number of attempts.

The fourth activity – constructing a right triangle – presented the greatest level of difficulty. Students required substantially more time, approximately six minutes, and several successive attempts before successfully completing the task. Observation of the activity suggested that the difficulty arose from two complementary factors. First, students needed to recognize and maintain the appropriate geometric relationships among the three vertices while continuously adjusting their own positions. Second, they were required to coordinate their movements collaboratively, making simultaneous decisions about both individual positioning and group strategy.

Communication during this activity was particularly rich. Students continuously negotiated possible solutions through verbal discussion, gestures, and even physical guidance, with the oldest participant assisting the younger students in achieving the desired configuration. These observations illustrate the collaborative character of the environment and demonstrate how embodied interaction naturally promotes communication and joint problem solving.

The post-activity interviews further confirmed students' positive perceptions of the learning experience. One participant summarized the experience by stating:

> *"It was enjoyable. It was less boring than a normal lesson. I'm not sure whether we learned more, but it was definitely more interesting."*

Although informal, this comment reflects the increased engagement observed throughout the evaluation. Furthermore, students were able to recall the objectives of each activity and explain the mathematical concepts involved, even when their mathematical terminology was not always fully precise.

### 8.3 Observed Limitations

The pilot study also revealed several technical and pedagogical limitations that will guide future development of the environment.

Although participant localization was generally accurate, natural body movements – particularly arm movements – occasionally caused small fluctuations in the detected position. This issue became most evident during the first activity, where students were required to remain stationary at predefined locations. The observed positional jitter resulted primarily from changes in the body outline detected by the YOLO object detector, which is inherently sensitive to variations in body posture and gesture.

Potential solutions include replacing the current detection and tracking pipeline with approaches such as FairMOT or incorporating an additional camera to improve localization accuracy. While the latter option would likely enhance robustness, it would also increase both hardware complexity and deployment cost, reducing one of the principal advantages of the proposed environment.

A second limitation involved participant re-identification following temporary occlusions. In a small number of cases, the system failed to recover a participant's original identity after one student temporarily obscured another. Although this issue did not interfere with the activities performed during the pilot study, it highlighted the importance of robust identity preservation in collaborative embodied environments. Following the completion of the pilot evaluation, adjustments to the tracking parameters substantially improved this behaviour.

### 8.4 Implications for Future Design

Beyond the technical observations, the pilot study provided valuable insights into the pedagogical design of embodied learning activities.

One important finding concerned the need for immediate visual feedback. During the evaluation, participants relied primarily on verbal guidance from the facilitator to determine whether an activity had been completed successfully. Future versions of the environment will therefore incorporate automatic visual feedback, similar to that employed in the Mathematics Imagery Trainer, enabling students to receive continuous information about their progress without external intervention.

The evaluation also highlighted the importance of instructional scaffolding during complex collaborative activities. The right-triangle construction required students not only to control their own movements but also to coordinate their actions with those of their peers while reasoning about geometric relationships. General verbal instructions proved insufficient for supporting this process. Future activities will therefore incorporate more explicit collaboration scripts, micro-scenarios, and problem-solving strategies to guide learners through increasingly demanding collaborative tasks.

Finally, it should be acknowledged that the positive reactions reported by the participants may partly reflect the novelty of the experience rather than the intrinsic educational effectiveness of the environment. Consequently, the present findings should be interpreted as formative rather than conclusive. Larger and longer-term classroom studies will be required to investigate the sustained educational impact of the proposed environment under authentic teaching conditions.

## 9. Conclusions and Future Work

This chapter presented the design, implementation, and formative evaluation of a collaborative embodied learning environment for geometry that combines computer vision, artificial intelligence, and embodied learning principles. The proposed environment enables students to engage with geometric concepts through coordinated physical movement, collaboration, and real-time interaction within a shared digital workspace.

Unlike many existing embodied learning environments, the proposed system has been designed to operate using only widely available classroom equipment, including a conventional camera, a computer, and a projector or large display. By combining recent advances in deep-learning-based multi-object tracking with a reusable software architecture, the environment provides a practical and scalable platform that can support embodied learning activities without requiring specialized sensing technologies or immersive installations.

The formative pilot evaluation demonstrated that the environment is technically capable of supporting collaborative geometry activities involving multiple participants. Students successfully completed all four learning activities, remained actively engaged throughout the session, and reported positive perceptions of the overall learning experience. At the same time, the evaluation identified several technical and pedagogical challenges that will guide future development, including improving positional stability, strengthening participant re-identification following temporary occlusions, providing richer instructional scaffolding, and incorporating more informative real-time visual feedback.

Although this was only a small formative study, our findings suggest that deep-learning-based tracking can provide a workable foundation for embodied learning in real classrooms. Crucially, because our system relies on a standard camera rather than depth sensors or wearables, it demonstrates a practical path toward making embodied geometry activities accessible to ordinary schools.

Our future agenda comprises three strands. First, we will develop additional curriculum-aligned activities, focusing particularly on the concept of angle and geometric transformations. Second, we intend to replace positional tracking with full-body pose estimation (e.g., MediaPipe), which would allow us to capture students' gestures and posture as additional data streams. Third, we have initiated discussions with local schools to plan a larger, longitudinal study that will assess retention and transfer of geometric understanding. While we currently target geometry, we view the underlying software as a general-purpose orchestration tool—one that we believe is equally applicable to any domain where group coordination and spatial decision-making are pedagogically relevant.
