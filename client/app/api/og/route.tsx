import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const title = searchParams.get("title") || "Tabi";
    const description =
      searchParams.get("description") ||
      "Plan trips together. Build itineraries, track budgets, and collaborate in real time.";
    const coverImage = searchParams.get("coverImage") || "";

    return new ImageResponse(
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "space-between",
          backgroundColor: "#FAFAF8",
          padding: "60px 80px",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        {coverImage && (
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: "flex",
              opacity: 0.15,
            }}
          >
            <img
              src={coverImage}
              alt="Cover"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            />
          </div>
        )}

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            justifyContent: "center",
            flex: 1,
            width: "100%",
            zIndex: 1,
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              backgroundColor: "#93CDFF",
              border: "4px solid #1A1A1A",
              borderRadius: "16px",
              padding: "40px 50px",
              boxShadow: "8px 8px 0px #1A1A1A",
              maxWidth: "900px",
            }}
          >
            <h1
              style={{
                fontSize: 64,
                fontWeight: 800,
                color: "#111111",
                margin: 0,
                lineHeight: 1.2,
                letterSpacing: "-0.02em",
              }}
            >
              {title}
            </h1>
            {description && description !== title && (
              <p
                style={{
                  fontSize: 28,
                  color: "#1A1A1A",
                  margin: "20px 0 0 0",
                  lineHeight: 1.4,
                  opacity: 0.9,
                }}
              >
                {description.length > 120
                  ? `${description.substring(0, 120)}...`
                  : description}
              </p>
            )}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
            zIndex: 1,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "20px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "80px",
                height: "80px",
                backgroundColor: "#93CDFF",
                border: "3px solid #1A1A1A",
                borderRadius: "12px",
                boxShadow: "5px 5px 0px #1A1A1A",
                fontSize: 48,
                color: "#111111",
                fontWeight: 700,
              }}
            >
              旅
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
              }}
            >
              <span
                style={{
                  fontSize: 48,
                  fontWeight: 800,
                  color: "#111111",
                  lineHeight: 1,
                  letterSpacing: "-0.02em",
                }}
              >
                tabi
              </span>
              <span
                style={{
                  fontSize: 20,
                  color: "#666666",
                  marginTop: "8px",
                }}
              >
                your journey, together.
              </span>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              width: "120px",
              height: "80px",
              backgroundColor: "#FFE29A",
              border: "3px solid #1A1A1A",
              borderRadius: "12px",
              boxShadow: "5px 5px 0px #1A1A1A",
            }}
          />
        </div>
      </div>,
      {
        width: 1200,
        height: 630,
      },
    );
  } catch (e: any) {
    console.error(`Failed to generate OG image: ${e.message}`);
    return new Response(`Failed to generate image`, {
      status: 500,
    });
  }
}
