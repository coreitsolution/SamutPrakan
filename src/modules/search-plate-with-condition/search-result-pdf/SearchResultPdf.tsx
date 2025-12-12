import jsPDF from "jspdf";
import { saveAs } from "file-saver";
import dayjs from "dayjs";

// Types
import {
  SearchPlateCondition
} from "../../../features/search/SearchTypes"

// Utils
import {
  reformatString,
  getImageFormat,
  loadFont
} from "../../../utils/commonFunction"

export const generateSearchResultPdfBlob = async (
  data: SearchPlateCondition[],
  t: (key: string) => string,
  i18n: any,
  fileUrl: string
) => {

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();

  try {
    const regularFontBase64 = await loadFont("/fonts/Sarabun-Regular.ttf");
    const boldFontBase64 = await loadFont("/fonts/Sarabun-Bold.ttf");
    const semiBoldFontBase64 = await loadFont("/fonts/Sarabun-SemiBold.ttf");

    doc.addFileToVFS("Sarabun-Regular.ttf", regularFontBase64);
    doc.addFileToVFS("Sarabun-Bold.ttf", boldFontBase64);
    doc.addFileToVFS("Sarabun-SemiBold.ttf", semiBoldFontBase64);

    doc.addFont("Sarabun-Regular.ttf", "Sarabun", "normal");
    doc.addFont("Sarabun-Bold.ttf", "Sarabun", "bold");
    doc.addFont("Sarabun-SemiBold.ttf", "Sarabun", "semi-bold");

    doc.setFont("Sarabun", "normal");
  } catch (error) {
    console.warn("Failed to load Thai fonts, using default:", error);
  }

  // Page Header
  const addHeader = (pageNum: number, totalPages: number) => {
    doc.addImage("/project-logo/pdf-logo.png", "JPEG", 8, 3, 18, 15);
    doc.setFont("Sarabun", "semi-bold");
    doc.setTextColor("#2A2C2E");
    doc.setFontSize(12);
    doc.text(`${pageNum}/${totalPages}`, pageWidth - 5, 8, { align: "right" });
    doc.setFont("Sarabun", "semi-bold");
    doc.setFontSize(15);
    doc.text(t("pdf.search-with-condition"), 60, 25);
  };

  const itemsPerPage = 8;
  const totalPages = Math.ceil(data.length / itemsPerPage);

  let y = 35;
  let currentPage = 1;
  addHeader(currentPage, totalPages);

  data.forEach((item, index) => {
    // Box outline
    doc.setDrawColor("#777777");
    doc.rect(10, y - 5, pageWidth - 20, 32);

    // Box outline (Images)
    doc.setDrawColor("#777777");
    doc.rect(10, y - 5, 60, 32);

    // Images
    const vehicleImage = item.vehicle_image_url ? `${fileUrl}${item.vehicle_image_url}` : "/images/no_image.png"
    const plateImage = item.plate_image_url ? `${fileUrl}${item.plate_image_url}` : "/images/no_image.png"
    doc.addImage(vehicleImage, getImageFormat(vehicleImage), 13, y - 2, 26, 26);
    doc.addImage(plateImage, getImageFormat(plateImage), 41, y - 2, 26, 26);

    doc.setFillColor("#C5C8CB");
    doc.rect(70, y - 5, 130, 12, "F");

    // Box outline
    doc.setDrawColor("#777777");
    doc.rect(70, y - 5, 130, 12);

    // Status
    doc.setFontSize(12);
    doc.setFont("Sarabun", "bold");
    doc.setTextColor(item.isBlackList && item.isBlackList ? "#9F0C0C" : "#4A4A4A");
    doc.text(item.special_plate_name ? reformatString(item.special_plate_name) : t('text.normal'), 75, y + 2);

    doc.setTextColor("#4A4A4A");
    doc.setFont("Sarabun", "normal");
    doc.text(dayjs(item.epoch_end).format("DD/MM/YYYY HH:mm"), 100, y + 2);
    doc.text(`${t('text.checkpoint')} : ${item.camera_name}`, pageWidth - 70, y + 2);

    // Plate info
    doc.text(`${item.plate_prefix} ${item.plate_number}`, (pageWidth / 2) - 5, y + 16, { align: "center" });
    doc.text(`${item.region ? (i18n.language === "th" ? item.region.name_th : item.region.name_en) : ""}`, (pageWidth / 2) - 5, y + 22, { align: "center" });
    doc.setTextColor("#2A2C2E");
    if (!item.vehicle_make_details && !item.vehicle_model_details && !item.vehicle_color_details) {
      doc.text("-", (pageWidth / 2) + 60, y + 19, { align: "center" });
    }
    else {
      doc.text(`${item.vehicle_make_details ? 
        i18n.language === "th" ? 
          item.vehicle_make_details.make_th ? ` ${item.vehicle_make_details.make_th}` : "" : item.vehicle_make_details.make_en ? ` ${item.vehicle_make_details.make_en}` : "" : ""}${item.vehicle_model_details ? item.vehicle_model_details.model_en ? ` ${t('text.model-only')} ${item.vehicle_model_details.model_en}` : "" : ""}`, 
        (pageWidth / 2) + 60, 
        y + 16, 
        { align: "center" });
      doc.text(`${item.vehicle_color_details ? i18n.language === "th" ? item.vehicle_color_details.color_th ? `${t('text.color')}${item.vehicle_color_details.color_th}` : "" : item.vehicle_color_details.color_en ? `${t('text.color')}${item.vehicle_color_details.color_en}` : "" : ""}`, (pageWidth / 2) + 60, y + 22, { align: "center" });
    }
    
    y += 32;

    // Page break
    if (y > 270 && index < data.length - 1) {
      doc.addPage();
      currentPage++;
      y = 35;
      addHeader(currentPage, totalPages);
    }
  });

  return doc.output("blob");
};

export const downloadSearchResultPdf = async (
  data: SearchPlateCondition[],
  fileName: string,
  t: (key: string) => string,
  i18n: any,
  fileUrl: string
) => {
  const blob = await generateSearchResultPdfBlob(data, t, i18n, fileUrl);
  saveAs(blob, fileName);
};