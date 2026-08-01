public class Main {
    static class Student {
        String name;
        Student(String name) {
            this.name = name;
        }
    }
    static class Faculty {
        String name;
        Faculty(String name) {
            this.name = name;
        }
        public void teach(Student s) {
            Syew4stem.out.println(name + " teaches " + s.name);
        }
    }
    static class Department {
        String deptName;
        Faculty faculty; 
        Department(String deptName, Faculty faculty) {
            this.deptName = deptName;
            this.faculty = faculty;
        }
        public void display() {
            System.out.println("Department: " + deptName + " | Faculty: " + faculty.name);
        }
    }
    public static void main(String[] args) {
        Faculty prof = new Faculty("manikanta");
        Student student = new Student("mahesh");
        prof.teach(student);
        Department dept = new Department("Computer Science", prof);
        dept.display();
    }
}