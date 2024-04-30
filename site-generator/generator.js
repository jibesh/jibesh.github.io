const pug = require('pug');
const fs = require('fs');
const path = require('path');
const { log } = require('console');

const pcloud_public_folder = "https://filedn.eu/lb9zswHPkyQBL9nU0dIVDrp"

let today = new Date();
let currentDate = `${today.getDate()} ${today.toLocaleString('default', { month: 'long' })} ${today.getFullYear()}`;

const classDetails = [{
    "year": "2019-2021",
    "id": "-",
    "course name": "Program Analysis"
},
{
    "year": "2019-2020",
    "id": "-",
    "course name": "Machine Learning for Programming"
}
]

const PositionsExp = [{
    "logo_src": `${pcloud_public_folder}/logo/honda.png`,
    "alt_text": "HRI",
    "institue": "Honda Research Institute",
    "flag_src": `${pcloud_public_folder}/flags/germany.png`,
    "time": "Feb. 2023 - May. 2024",
    "position_place": "Systems Software Engineer, Offenbach am Main, Germany",
}, {
    "logo_src": `${pcloud_public_folder}/logo/sap.png`,
    "alt_text": "SAP",
    "institue": "SAP SE",
    "flag_src": `${pcloud_public_folder}/flags/germany.png`,
    "time": "May 2021 - Jan. 2023",
    "position_place": "Senior Developer, Walldorf, Germany",
}, {
    "logo_src": `${pcloud_public_folder}/logo/uni-stuttgart.png`,
    "alt_text": "HRI",
    "institue": "University of Stuttgart",
    "flag_src": `${pcloud_public_folder}/flags/germany.png`,
    "time": "Mar. 2019 - Apr. 2021",
    "position_place": "Research Assistant, Stuttgart, Germany",
}, {
    "logo_src": `${pcloud_public_folder}/logo/microsoft.png`,
    "alt_text": "MSR",
    "institue": "Microsoft Research",
    "flag_src": `${pcloud_public_folder}/flags/uk.png`,
    "time": "Jun. 2018 - Sep. 2018",
    "position_place": "Research Intern, Cambridge, United Kingdom",
}, {
    "logo_src": `${pcloud_public_folder}/logo/microsoft.png`,
    "alt_text": "MSR",
    "institue": "Microsoft Research",
    "flag_src": `${pcloud_public_folder}/flags/india.png`,
    "time": "Jun. 2017 - Sep. 2017",
    "position_place": "Research Intern, Bangalore, India",
}, {
    "logo_src": `${pcloud_public_folder}/logo/tu-darmstadt.png`,
    "alt_text": "TUD",
    "institue": "TU Darmstadt",
    "flag_src": `${pcloud_public_folder}/flags/germany.png`,
    "time": "Mar. 2015 - Feb. 2019",
    "position_place": "Research Assistant, Darmstadt, Germany",
}, {
    "logo_src": `${pcloud_public_folder}/logo/mpi-sws.png`,
    "alt_text": "MPI-SWS",
    "institue": "Max Planck Institute for Software Systems",
    "flag_src": `${pcloud_public_folder}/flags/germany.png`,
    "time": "Oct. 2013 - Dec. 2013",
    "position_place": "Intern, Kaiserslautern, Germany",
}, {
    "logo_src": `${pcloud_public_folder}/logo/mpi-hlr.jpeg`,
    "alt_text": "MPI-HLR",
    "institue": "Max Planck Institute for Heart and Lung Research",
    "flag_src": `${pcloud_public_folder}/flags/germany.png`,
    "time": "Jun. 2013 - Sep. 2013",
    "position_place": "Intern, Bad Nauheim, Germany",
}, {
    "logo_src": `${pcloud_public_folder}/logo/google.png`,
    "alt_text": "GSOC",
    "institue": "Google Summer of Code",
    "flag_src": `${pcloud_public_folder}/flags/india.png`,
    "time": "May 2012 - Aug. 2012",
    "position_place": "Intern, Remote",
}, {
    "logo_src": `${pcloud_public_folder}/logo/wb.png`,
    "alt_text": "School",
    "institue": "High School",
    "flag_src": `${pcloud_public_folder}/flags/india.png`,
    "time": "Aug. 2010 - Aug. 2011 and Apr. 2014 - Jan. 2015",
    "position_place": "Assistant Teacher, Bud Bud, India",
}, {
    "logo_src": `${pcloud_public_folder}/logo/wipro.png`,
    "alt_text": "Wipro",
    "institue": "Wipro Technologies",
    "flag_src": `${pcloud_public_folder}/flags/india.png`,
    "time": "May 2010 - Aug. 2010",
    "position_place": "Project Engineer, Hyderabad, India",
}];

const news = JSON.parse(fs.readFileSync("news.json", "utf-8"))
const papers = JSON.parse(fs.readFileSync("papers.json", "utf-8"))

const outDir = "../"

let IndexFile = pug.compileFile('index.pug', { pretty: true });

let indexstr = IndexFile({
    title_of_page: 'About Jibesh',
    page_name: "index.html",
    currentDate:currentDate,
    classDetails: classDetails,
    PositionsExp: PositionsExp,
    news: news,
    cv_link: `${pcloud_public_folder}/cv.pdf`,
    profile_image: `${pcloud_public_folder}/pictures/prof1.jpg`,
    profile_image_cr: `${pcloud_public_folder}/pictures/prof1_cr.jpg`
});



fs.writeFileSync(path.join(outDir, "index.html"), indexstr, {
    encoding: "utf8",
    flag: "w+"
});

let ResearchFile = pug.compileFile('research.pug', { pretty: true });
let researchstr = ResearchFile({
    title_of_page: 'Research',
    page_name: "research.html",
    currentDate: currentDate,
    paper_list: papers
});
fs.writeFileSync(path.join(outDir, "research.html"), researchstr, {
    encoding: "utf8",
    flag: "w+"
});

// Copy site assests
fs.copyFileSync("./site-assests/my-script.js", path.join(outDir, "my-script.js"))
fs.copyFileSync("./site-assests/my-styles.css", path.join(outDir, "my-styles.css"))


function delDestCopyFiles(sourceDir, destDir) {
    fs.rmdirSync(destDir);
    let all_files = fs.readdirSync(sourceDir)
    all_files.forEach(fl => {
        const flPath = `${sourceDir}/${fl}`;
        fs.copyFileSync(flPath, `${destDir}${fl}`)
    })
}