import pdfMake from "pdfmake/build/pdfmake";
import { saveAs } from "file-saver";
import dayjs from "dayjs";
import { TDocumentDefinitions, Content } from "pdfmake/interfaces";

// Types
import { StatisticPdfData } from "../../../features/chart/types";

// Utils
import { loadFont, formatNumber } from "../../../utils/commonFunction";

// Configure pdfMake fonts
const configureFonts = async () => {
  try {
    const regularFontBase64 = await loadFont("/fonts/Sarabun-Regular.ttf");
    const boldFontBase64 = await loadFont("/fonts/Sarabun-Bold.ttf");
    const semiBoldFontBase64 = await loadFont("/fonts/Sarabun-SemiBold.ttf");

    pdfMake.vfs = {
      "Sarabun-Regular.ttf": regularFontBase64,
      "Sarabun-Bold.ttf": boldFontBase64,
      "Sarabun-SemiBold.ttf": semiBoldFontBase64,
    };

    pdfMake.fonts = {
      Sarabun: {
        normal: "Sarabun-Regular.ttf",
        bold: "Sarabun-Bold.ttf",
        italics: "Sarabun-SemiBold.ttf",
      },
    };
  } catch (error) {
    console.warn("Failed to load Thai fonts:", error);
  }
};

export const generateStatisticPdfBlob = async (
  data: StatisticPdfData,
  t: (key: string) => string,
  i18n: any
): Promise<Blob> => {
  await configureFonts();

  // Current Date
  const currentDate = dayjs().format(
    i18n.language === "th" ? "DD/MM/BBBB HH:mm:ss" : "DD/MM/YYYY HH:mm:ss"
  );

  // Format dates
  const dateValue = data?.vehiclePassCheckpoints?.todayDate;
  const dailyDate = dateValue
    ? i18n.language === "th"
      ? dayjs(dateValue).locale("th").format("DD MMMM BBBB")
      : dayjs(dateValue).format("DD MMMM YYYY")
    : "-";

  const monthValue = data?.vehiclePassCheckpoints?.thisMonthDate;
  const monthlyDate = monthValue
    ? i18n.language === "th"
      ? dayjs(monthValue).locale("th").format("MMMM BBBB")
      : dayjs(monthValue).format("MMMM YYYY")
    : "-";

  const yearValue = data?.vehiclePassCheckpoints?.thisYearDate;
  const yearlyDate = yearValue
    ? i18n.language === "th"
      ? dayjs(monthValue).locale("th").format("BBBB")
      : dayjs(monthValue).format("YYYY")
    : "-";

  const docDefinition: TDocumentDefinitions = {
    pageSize: "A4",
    pageOrientation: "portrait",
    pageMargins: [ 20, 10, 20, 10 ],
    defaultStyle: {
      font: "Sarabun",
      fontSize: 11,
    },
    content: [
      // Header
      {
        columns: [
          {
            image: await loadImageAsBase64("/project-logo/pdf-logo.png"),
            width: 50,
            margin: [0, 0, 0, 10],
          },
          {
            width: "*",
            text: "",
          },
          {
            stack: [
              {
                text: [
                  { text: `${t("pdf.print-date")} : `, bold: true, fontSize: 10 },
                  { text: currentDate, fontSize: 10 },
                ],
                alignment: "right",
                margin: [0, 15, 0, 0],
              },
            ],
          },
        ],
      },
      // Title
      {
        text: t("pdf.statistic-data"),
        style: "header",
        alignment: "center",
        margin: [0, -10, 0, 15],
      },
      // Checkpoint
      {
        text: [
          { text: `${t("pdf.checkpoint")} : `, bold: true },
          { text: data.checkpoints },
        ],
        margin: [i18n.language === "th" ? 46 : 66, 0, 0, 30],
        leadingIndent: i18n.language === "th" ? -46 : -66,
      },
      // Three boxes section
      {
        canvas: [
          {
            type: "rect",
            x: 0,
            y: 0,
            w: 560,
            h: 95,
            lineColor: "#777777",
          },
        ],
        margin: [0, 0, 0, 0],
      },
      {
        columns: [
          createStatBox(t("pdf.daily"), dailyDate, data?.vehiclePassCheckpoints?.today || 0),
          createStatBox(t("pdf.monthly"), monthlyDate, data?.vehiclePassCheckpoints?.thisMonth || 0),
          createStatBox(t("pdf.yearly"), yearlyDate, data?.vehiclePassCheckpoints?.thisYear || 0),
        ],
        columnGap: 0,
        margin: [0, -65, 0, 20],
      },
      // Vehicle Pass Checkpoint Section
      {
        text: t("pdf.vehicle-pass-checkpoint"),
        style: "sectionTitle",
        margin: [5, -95, 0, 65],
      },
      // Chart 1: Vehicle Pass Checkpoints Per Hour
      createChartSection(
        t("pdf.vehicle-detect-per-hour"),
        currentDate,
        data.imageVehiclePassCheckpointsPerHour,
        { width: 540, height: 153 },
        t("pdf.data-date")
      ),
      // Chart 2: Vehicle Pass Checkpoints Yearly
      {
        margin: [0, 10, 0, 0],
        stack: [
          {
            canvas: [
              {
                type: "rect",
                x: 0,
                y: 0,
                w: 560,
                h: 193,
                lineColor: "#777777",
              },
              {
                type: "rect",
                x: 0,
                y: 0,
                w: 560,
                h: 28,
                lineColor: "#777777",
              },
            ],
          },
          {
            columns: [
              {
                text: t("pdf.vehicle-pass-checkpoint-yearly"),
                style: "sectionTitle",
                width: "*",
              },
            ],
            margin: [5, -189, 0, 0],
          },
          {
            image: data.imageVehiclePassCheckpointsYearly,
            width: 420,
            height: 153,
            alignment: "center",
            margin: [0, 10, 0, 0],
          },
          {
            text: `${t("pdf.year")} : ${data.vehiclePassCheckpointsYearlyData.year}`,
            alignment: "right",
            margin: [0, -150, 10, 0],
          },
        ],
      },
      // Bottom two charts side by side
      {
        columns: [
          // Weekly Chart
          {
            stack: [
              {
                canvas: [
                  {
                    type: "rect",
                    x: 0,
                    y: 0,
                    w: 278.5,
                    h: 198,
                    lineColor: "#777777",
                  },
                  {
                    type: "rect",
                    x: 0,
                    y: 0,
                    w: 278.5,
                    h: 28,
                    lineColor: "#777777",
                  },
                ],
              },
              {
                text: t("pdf.vehicle-pass-weekly"),
                style: "sectionTitle",
                margin: [5, -193, 0, 0],
              },
              {
                text: [
                  { text: `${t("pdf.from")} : `, bold: true, fontSize: 12 },
                  { text: `${data.vehiclePassCheckpointsWeeklyData.dateFrom} - ${data.vehiclePassCheckpointsWeeklyData.dateTo}`, fontSize: 12 },
                ],
                margin: [50, 13, 0, 5],
              },
              {
                image: data.imageVehiclePassCheckpointsWeekly,
                width: 235,
                height: 127,
                alignment: "center",
                margin: [0, 10, 0, 0],
              },
            ],
          },
          // Special Plate Chart
          {
            width: 3,
            text: "",
          },
          {
            stack: [
              {
                canvas: [
                  {
                    type: "rect",
                    x: 0,
                    y: 0,
                    w: 278.5,
                    h: 198,
                    lineColor: "#777777",
                  },
                  {
                    type: "rect",
                    x: 0,
                    y: 0,
                    w: 278.5,
                    h: 28,
                    lineColor: "#777777",
                  },
                ],
              },
              {
                text: t("pdf.special-plate"),
                style: "sectionTitle",
                margin: [5, -193, 0, 0],
              },
              {
                text: [
                  { text: `${t("pdf.from")} : `, bold: true, fontSize: 12 },
                  { text: `${data.specialPlateChartData.dateFrom} - ${data.specialPlateChartData.dateTo}`, fontSize: 12 },
                ],
                margin: [50, 13, 0, 5],
              },
              {
                image: data.imageSpecialPlateChart,
                width: 185,
                height: 142,
                alignment: "left",
                margin: [-20, -10, 0, 0],
              },
              // Legend
              {
                stack: [
                  {
                    columns: [
                      {
                        canvas: [
                          {
                            type: "ellipse",
                            x: 60,
                            y: -85,
                            r1: 4,
                            r2: 4,
                            color: "#FFBC28",
                          },
                        ],
                        width: 15,
                      },
                      {
                        width: 130,
                        text: `${t("pdf.watch-list")} (${t("pdf.vehicle")}): `,
                        fontSize: 10,
                        margin: [55, -92, 0, 0],
                      },
                      {
                        width: '*',
                        text: formatNumber(data.specialPlateChartData.total_watch_list),
                        fontSize: 10,
                        margin: [0, -92, 0, 0],
                      },
                    ],
                    margin: [75, 0, 0, 3],
                  },
                  {
                    columns: [
                      {
                        canvas: [
                          {
                            type: "ellipse",
                            x: 60,
                            y: -70,
                            r1: 4,
                            r2: 4,
                            color: "#E1403A",
                          },
                        ],
                        width: 15,
                      },
                      {
                        width: 130,
                        text: `${t("pdf.black-list")} (${t("pdf.vehicle")}): `,
                        fontSize: 10,
                        margin: [55, -77, 0, 0],
                      },
                      {
                        width: '*',
                        text: formatNumber(data.specialPlateChartData.total_black_list),
                        fontSize: 10,
                        margin: [0, -77, 0, 0],
                      },
                    ],
                    margin: [75, 0, 0, 0],
                  },
                ],
              },
            ],
          },
        ],
        margin: [0, 148, 0, 0],
      },
    ],
    styles: {
      header: {
        fontSize: 15,
        bold: true,
      },
      sectionTitle: {
        fontSize: 14,
        bold: true,
      },
      statBox: {
        alignment: "center",
      },
    },
  };

  return new Promise((resolve, reject) => {
    try {
      const pdfDocGenerator = pdfMake.createPdf(docDefinition);
      pdfDocGenerator.getBlob((blob: Blob) => {
        resolve(blob);
      });
    } catch (error) {
      reject(error);
    }
  });
};

// Helper function to create stat boxes
function createStatBox(
  title: string,
  date: string,
  value: number,
  boxWidth: number = 186.7,
  boxHeight: number = 65
): Content {
  return {
    columns: [
      {
        width: boxWidth,
        stack: [
          // Outer rectangle
          {
            canvas: [
              {
                type: "rect",
                x: 0,
                y: 0,
                w: boxWidth,
                h: boxHeight,
                lineColor: "#777777",
              },
            ],
          },
          // Title and date
          {
            columns: [
              {
                text: title,
                bold: true,
                fontSize: 11,
                width: "*",
                margin: [5, -boxHeight + 5, 0, 0],
              },
              {
                text: date,
                fontSize: 11,
                alignment: "right",
                width: "*",
                noWrap: true,
                margin: [-5, -boxHeight + 5, 5, 0],
              },
            ],
          },
          // Value
          {
            text: formatNumber(value),
            fontSize: 16,
            bold: true,
            alignment: "center",
            margin: [0, -boxHeight + 30, 0, 0],
          },
        ],
      }
    ]
  };
}

// Helper function to create chart sections with flexible width
function createChartSection(
  title: string,
  date: string,
  imageData: string,
  dimensions: { width: number; height: number },
  dateLabel: string
): Content {
  return {
    margin: [0, 10, 0, 0],
    stack: [
      {
        canvas: [
          {
            type: "rect",
            x: 0,
            y: 0,
            w: 560,
            h: dimensions.height + 40,
            lineColor: "#777777",
          },
          {
            type: "rect",
            x: 0,
            y: 0,
            w: 560,
            h: 28,
            lineColor: "#777777",
          },
        ],
      },
      {
        columns: [
          {
            text: title,
            style: "sectionTitle",
            width: "*",
          },
          {
            text: [
              { text: `${dateLabel} : `, bold: true, fontSize: 9 },
              { text: date, fontSize: 9 },
            ],
            alignment: "right",
            width: "auto",
            margin: [0, 2, 0, 0],
          },
        ],
        margin: [5, -dimensions.height - 35, 5, 0],
      },
      {
        image: imageData,
        width: dimensions.width,
        height: dimensions.height,
        alignment: "center",
        margin: [0, 10, 0, 0],
      },
    ],
  };
}

// Helper function to load image as base64
async function loadImageAsBase64(url: string): Promise<string> {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error("Failed to load image:", error);
    return "";
  }
}

export const downloadStatisticPdf = async (
  data: StatisticPdfData,
  fileName: string,
  t: (key: string) => string,
  i18n: any
) => {
  const blob = await generateStatisticPdfBlob(data, t, i18n);
  saveAs(blob, fileName);
};