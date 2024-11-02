function getDailySchedule(teacherData, day) {

  // Günlere karşılteacherDataık gelen sütun indeksleri 
  const days = {
    "PAZARTESİ": 1,
    "SALI": 8,
    "ÇARŞAMBA": 15,
    "PERŞEMBE": 22,
    "CUMA": 29

  };

  // Gün bilgisine göre sütun indeksini bul
  const columnIndex = days[day];



  // Belirtilen sütündaki tüm değerleri al (dersler)
  const dailySchedule = teacherData[0].slice(columnIndex, columnIndex + 7);

  return dailySchedule;
}




function matchTeacherDuty(teacherData, day, periodCheck,leaveTeacherBranch) {
  //console.log(teacherData,day,periodCheck)

  if (periodCheck == "SABAH") {
    var dutyTable = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("NÖBET TAKİP SABAH GRB");
  } else {
    var dutyTable = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("NÖBET TAKİP ÖĞLEN GRB");
  }


  var dutyData = dutyTable.getDataRange().getValues();

  function matchLessonDuty(dutyData) {
    var matchLessonTeachers = []
    var teachers = []
    try {

      for (var i = 1; i < dutyData.length; i++) {
            if(dutyData[i + 3]==undefined){
              continue
            }
            
            if(dutyData[i + 3][3]==""){
                dutyData[i + 3][3]=0 

              }
        if (dutyData[i + 3][0] == day && dutyData[i + 3][0] !=undefined) {


          for (var j = 0; j < teacherData.length; j++) {



            if (dutyData[i + 3][j + 4] === "" && teacherData[j] !== "") {


              var matchTeacher = {
                "teacherName": dutyData[i + 3][1],
                "matchTeacherBranch":dutyData[i + 3][2],
                "teacherDutyCount": dutyData[i + 3][3],
                "assignedLesson": teacherData[j],
                "lessonTime": j + 1
              }

              teachers.push(dutyData[i + 3][1])

              matchLessonTeachers.push(matchTeacher)


            }


          }


        }

        

      }

      
      return matchLessonTeachers

    }
    catch (e) {
      console.log("hata oluştu (matchTeacherDuty func) "+e.message)
    }
  }




  var matchTeachers = matchLessonDuty(dutyData)

  

const maxLessonTime = Math.max(...matchTeachers.map(teacher => teacher.lessonTime));

const result = [];
const teacherDutyCounts = {};

// Her lessonTime için öğretmenleri karşılaştır
for (let lessonTime = 1; lessonTime <= maxLessonTime; lessonTime++) {
  let minDutyCount = Infinity;
  let selectedTeacher = null;
  let bestMatchTeacher = null;
  let branchMatched = false;

  // lessonTime için en küçük teacherDutyCount değerine sahip öğretmeni bul
  for (const teacher of matchTeachers) {
    if (teacher.lessonTime === lessonTime) {
      const currentDutyCount = teacherDutyCounts[teacher.teacherName] || teacher.teacherDutyCount;

      // Check if the teacher's branch matches the leaveTeacherBranch
      if (teacher.matchTeacherBranch === leaveTeacherBranch) {
        branchMatched = true;
        if (currentDutyCount < minDutyCount) {
          minDutyCount = currentDutyCount;
          bestMatchTeacher = teacher;
        }
      }
    }
  }

  // Eğer branş eşleşmesi varsa, diğer branşlara bakmadan seçilen öğretmeni ata
  if (bestMatchTeacher) {
    const updatedDutyCount = (teacherDutyCounts[bestMatchTeacher.teacherName] || bestMatchTeacher.teacherDutyCount) + 1;
    result.push({ ...bestMatchTeacher, teacherDutyCount: updatedDutyCount });
    teacherDutyCounts[bestMatchTeacher.teacherName] = updatedDutyCount;
  } else {
    // Eğer branş eşleşmesi yoksa, diğer branşlardaki öğretmenler arasında en düşük teacherDutyCount değerine sahip olanı seç
    minDutyCount = Infinity;
    for (const teacher of matchTeachers) {
      if (teacher.lessonTime === lessonTime) {
        const currentDutyCount = teacherDutyCounts[teacher.teacherName] || teacher.teacherDutyCount;
        if (currentDutyCount < minDutyCount) {
          minDutyCount = currentDutyCount;
          selectedTeacher = teacher;
        }
      }
    }

    // Seçilen öğretmene görev ver ve teacherDutyCount değerini artır
    if (selectedTeacher) {
      const updatedDutyCount = (teacherDutyCounts[selectedTeacher.teacherName] || selectedTeacher.teacherDutyCount) + 1;
      result.push({ ...selectedTeacher, teacherDutyCount: updatedDutyCount });
      teacherDutyCounts[selectedTeacher.teacherName] = updatedDutyCount;
    }
  }
}

return result;

}





function matchTeacherNameLesson(dutymatchData,teacherData,leaveTeacherBranch){
    
  for (let i = 0; i < teacherData.length; i++) {
    let matchFound = false;

    for (let j = 0; j < dutymatchData.length; j++) {
      
      if (teacherData[i] === dutymatchData[j].assignedLesson && i+1== dutymatchData[j].lessonTime) {
        teacherData[i] = teacherData[i] + " " + dutymatchData[j].teacherName;

        if (dutymatchData[j].matchTeacherBranch === leaveTeacherBranch) {
          teacherData[i] += " ÜCRETLİ";
        }
        matchFound = true;
        break;
      }
    }

    if (!matchFound) {

      if(teacherData[i]==""){
        continue
      }else{
        teacherData[i] = teacherData[i] + " " + "NÖBETÇİ İDARECİ";
      }
      
    }
  }
  
 return teacherData;
    
}

function getTeacherSchedule(teacherName, periodCheck, dayCheck) {



  // Verilerin başladığı satır ve sütun (bu örnekte 4. satır, 2. sütun)
  var startRow = 4;
  var startColumn = 1;


  if (periodCheck == "SABAH") {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("SABAH ÖĞRETMEN ÇARŞAF");

  } else {

    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("ÖĞLEN ÖĞRETMEN ÇARŞAF");
  }

  // Tüm verileri iki boyutlu bir dizi olarak alırız
  var data = sheet.getRange(startRow, startColumn, sheet.getLastRow() - startRow + 1, sheet.getLastColumn() - startColumn + 1).getValues();




  // Öğretmenin bulunduğu satırı bulmak için döngü
  var teacherRow = -1;
  for (var i = 1; i < data.length; i++) {

    if (data[i][0] === teacherName) {
      teacherRow = i + startRow;
      break;
    }
  }

  // Eğer öğretmen bulunursa, o satırdaki verileri döndürürüz
  if (teacherRow != -1) {

    teacherData = sheet.getRange(teacherRow, startColumn, 1, sheet.getLastColumn() - startColumn + 1).getValues();
    var teacherDaySchedule = getDailySchedule(teacherData, dayCheck)

    return teacherDaySchedule

  } else {
    return "Öğretmen bulunamadı.";
  }
}


function cleanData(){
  var dutyTable = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("GÜNLÜK NÖBETÇİ ÖĞRETMEN DERS GÖREVLENDİRMESİ");

  var backRangeData=dutyTable.getRange('H4:K29').getValues();
  var skipRows = [10, 11, 12, 13]; 
    
  for(var i=0; i<backRangeData.length; i++){
    if (skipRows.includes(i)) {
      continue; // Değiştirilmeyecek satırları atla
    }

    
      for (var j=0; j<backRangeData[i].length; j++){

          
          if(backRangeData[i][j]!="YOK"){

            backRangeData[i][j]="YOK"

          }
         
      }
  }
 
  dutyTable.getRange('H4:K29').setValues(backRangeData)

  var rangeToClearMorning = dutyTable.getRange('A4:G14');
  var rangeToClearEvening = dutyTable.getRange('A19:G29');

   rangeToClearMorning.clearContent();
   rangeToClearEvening.clearContent();
}


function transferDailySchedule() {

   var response = Browser.msgBox("ÖĞRETMEN BİLGİLERİNİN DOĞRU BİR ŞEKİLDE GİRİLDİĞİNDEN EMİN OLUN. EĞER HATA VAR İSE VERİLERİ TEKRAR GİREREK BAŞLATIN", Browser.Buttons.OK_CANCEL);


  
  // Tablolara erişim
  var izinliTablo = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("GÜNLÜK NÖBETÇİ ÖĞRETMEN DERS GÖREVLENDİRMESİ");


  // Verileri al
  var izinliVeri = izinliTablo.getDataRange().getValues();


  // Döngü
  for (var i = 1; i < izinliVeri.length; i++) {
    try {
    
      if(izinliVeri[i + 2]==undefined){
              continue
            }
      teacherCheck = izinliVeri[i + 2][7]
      dayCheck = izinliVeri[i + 2][8]
      periodCheck = izinliVeri[i + 2][9]
      leaveTeacherBranch=izinliVeri[i + 2][10]






      if (teacherCheck != "YOK" && teacherCheck != "" && teacherCheck != "İZİNLİ ÖĞRETMEN" && dayCheck != "YOK" && periodCheck != "YOK" && leaveTeacherBranch != "YOK") {
        targetRow = [i + 3]
        targetColoum = 1

        var teacherSchedule = getTeacherSchedule(teacherCheck, periodCheck, dayCheck);

        var matchDutyTeacher = matchTeacherDuty(teacherSchedule, dayCheck, periodCheck,leaveTeacherBranch)

        

        

        var leaveTeacherinfo=matchTeacherNameLesson(matchDutyTeacher,teacherSchedule,leaveTeacherBranch)

        
        
        for (var j = 0; j < leaveTeacherinfo.length; j++) {
          izinliTablo.getRange(targetRow, targetColoum + j).setValue(leaveTeacherinfo[j]);
        }

        var succesUpdate=updateDutyTeacherCount(matchDutyTeacher,periodCheck)

        if(succesUpdate){
          var successMessage =updateTeacherDutyPayment(leaveTeacherinfo)
            if(successMessage){

              Browser.msgBox("KAYDETME İŞLEMİ BAŞARI İLE TAMAMLANDI. NÖBET TAKİP SAYFASINDA ÖĞRETMEN GÖREV SAYILARI ARTIRILDI VE ÜCRET ALAN NÖBETÇİ ÖĞRETMEN VAR İSE ÜCRET SAYFASINA EKLENDİ. EĞER ATAMALARDA FARKLILIK YAPACAKSANIZ İLGİLİ ALANLARI ELLE DÜZELTİNİZ.")

            }else{
              Browser.msgBox("BİR HATA OLUŞTU VE KAYDETME İŞLEMİ TAMAMLANAMADI")
            }
        }else{
           Browser.msgBox("BİR HATA OLUŞTU NÖBET TAKİP SAYFLARINI KONTROL EDİN")
        }

        
      }
      else if (teacherCheck != "YOK" && teacherCheck != "İZİNLİ ÖĞRETMEN" && (dayCheck == "YOK" || periodCheck == "YOK"|| leaveTeacherBranch=="YOK")) {
        Browser.msgBox("LÜTFEN ÖĞRETMEN İZİNLİ GÜNÜ, İZİNLİ OLDUĞU DEVRE VE BRANŞ BİLGİLERİNİ SEÇİP TEKRAR BAŞLATIN")
        break
      }
      else {
        continue

      }
    }
    catch (e) {
      console.log("hata oluştu (transferDersProgramı func) " + e.message)
      continue

    }





  }
}


function updateDutyTeacherCount(matchDutyTeacher, periodCheck) {
  

  try {

    if (periodCheck == "SABAH") {
    var dutyTable = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("NÖBET TAKİP SABAH GRB");
  } else {
    var dutyTable = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("NÖBET TAKİP ÖĞLEN GRB");
  }

  var dutyData = dutyTable.getDataRange().getValues();

    for (var i = 0; i < dutyData.length; i++) {
      var targetRow = i + 5;
      var targetColoum = 4;

      if (dutyData[i + 4] == undefined) {
        break;
      }

      for (var j = 0; j < matchDutyTeacher.length; j++) {
        if (dutyData[i + 4][1] == matchDutyTeacher[j].teacherName) {
          
          dutyData[i + 4][3] = matchDutyTeacher[j].teacherDutyCount;
          
          
          dutyTable.getRange(targetRow, targetColoum).setValue(dutyData[i + 4][3]);
          
        }
      }
    }

    return true
  } catch (e) {
    console.log("hata oluştu (updateDutyTeacherCount) " + e.message);
  }
}



function updateTeacherDutyPayment(leaveTeacherinfo) {
  try{

     var TeacherDutyPayment = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("NÖBETÇİ ÖĞRETMEN ÜCRETLİ GÖREVLENDİRME");
  var TeacherDutyPaymentData = TeacherDutyPayment.getDataRange().getValues();
  var lastRow = TeacherDutyPaymentData.length + 1;

  var paidTeachers = [];
  var paidTeacherNames = [];
  var paidTeacherIndices = [];
  var paidTeacherCounts = [];
  var currentDate = new Date();
  var formattedDate = currentDate.getDate() + '/' + (currentDate.getMonth() + 1) + '/' + currentDate.getFullYear();

  for (var i = 0; i < leaveTeacherinfo.length; i++) {
    var info = leaveTeacherinfo[i];
    if (info.includes("ÜCRETLİ")) {
      var teacherInfo = info.split('\n')[1].trim();
      var teacherName = teacherInfo.split(' ').slice(1, -1).join(' '); // Sadece öğretmen adını alır
      paidTeachers.push(teacherName);

      var countIndex = paidTeacherNames.indexOf(teacherName);
      if (countIndex !== -1) {
        paidTeacherCounts[countIndex]++;
        paidTeacherIndices[countIndex] += '-' + (i + 1);
      } else {
        paidTeacherNames.push(teacherName);
        paidTeacherCounts.push(1);
        
        paidTeacherIndices.push((i+1).toString());
      }
    }
  }

  // Eğer hiç "ÜCRETLİ" ifadesi içeren öğretmen yoksa, yazma işlemi yapma
  if (paidTeacherNames.length > 0) {
    for (var j = 0; j < paidTeacherNames.length; j++) {
      var newRow = [paidTeacherNames[j], formattedDate, paidTeacherIndices[j], paidTeacherCounts[j]];
      TeacherDutyPayment.getRange(lastRow + j, 1, 1, newRow.length).setValues([newRow]);
    }
  }

    return true
  }catch(e){
    console.log("hata oluştu (updateTeacherDutyPayment) "+ e.message)
  }

 
