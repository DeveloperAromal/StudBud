import CreateMeeting from "../../widgets/CreateMeeting";
import TeacherSideBar from "../../widgets/TeacherSideBar";

export default function Meeting() {
  return (
    <section className="w-full h-screen flex items-center justify-center overflow-hidden">
      <div>
        <TeacherSideBar />
      </div>
      <CreateMeeting />
    </section>
  );
}
