const fs = require('fs');
const csv = require('fast-csv');

const domainOrderArr = [];
const studentTestsArr = [];
const studentPlansArr = [];

function parseCSV() {
    // parse the .csv files and populate our global arrays with the data
    const domainOrderStream = fs.createReadStream("./data/domain_order.csv");

    csv.fromStream(domainOrderStream)
        .on("data", data => domainOrderArr.push(data))
        .on("end", () => {
            const studentTestStream = fs.createReadStream("./data/student_tests.csv");
            csv.fromStream(studentTestStream)
                .on("data", data => studentTestsArr.push(data))
                .on("end", () => generatePlans());
        });
};

function generatePlans() {
    const domainOrderObj = {};
    const studentObjArray = [];

    // turn the domain order array into an object (this just makes it easier to reason about)
    domainOrderArr.forEach(gradeLevel => {
        let gradeLevelArr = [];
        let gradeCode = gradeLevel[0];
        if (gradeCode === 'K') {gradeCode = '0'}
        for (let i = 1; i < gradeLevel.length; i++) {
            gradeLevelArr.push(gradeLevel[i]);
        }
        domainOrderObj[gradeCode] = (gradeLevelArr);
    });

    // do the same for each student
    for (let i = 1; i < studentTestsArr.length; i++) {
        let student = studentTestsArr[i];

        // create a spot for each student in the student plans array 
        studentPlansArr.push([student[0]]);

        let studentObj = {};

        for (let j=0; j< student.length; j++) {
            if (student[j] === 'K') {student[j] = '0'}
            studentObj[studentTestsArr[0][j]] = student[j];
        }

        studentObjArray.push(studentObj);
    };

    // access each key in the Domain Order and Student objects, in order by grade level
    Object.keys(domainOrderObj).forEach(gradeLevel => {
        let gradeLevelArr = domainOrderObj[gradeLevel];
        for (let i = 0; i < gradeLevelArr.length; i++) {
            let label = gradeLevelArr[i];
            studentObjArray.forEach((studentObj, index) => {
                let gradeLevelString = gradeLevel;

                // if a student's performance level is at or below this grade level in this
                // subject, add the plan code to their index in the student plans array
                if (studentObj[label] <= gradeLevel && studentPlansArr[index].length < 6) {
                    if (gradeLevel === '0') {gradeLevelString = 'K'}
                    studentPlansArr[index].push(gradeLevelString + "." + label);
                    studentObj[label] = (Number(studentObj[label]) + 1).toString()
                }
            })
        }
    })

    // translate the student plans array back into a .csv file and output it
    let studentPlanStream = fs.createWriteStream("./data/student_plans.csv");
    csv.write(studentPlansArr, { headers: true })
        .pipe(studentPlanStream)
        .on("finish", function () {
            console.log("Student plans created successfully!");
        });
};

parseCSV();