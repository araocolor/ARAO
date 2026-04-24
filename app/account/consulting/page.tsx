import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { syncProfile } from "@/lib/profiles";
import { getInquiriesByProfile } from "@/lib/consulting";
import { isDesignMode, mockInquiries } from "@/lib/design-mock";
import type { Inquiry } from "@/lib/consulting";
import { ConsultingSection } from "@/components/consulting-section";

const FAQ_ITEMS = [
  {
    question: ".NP3 파일이 최신 포맷인가요?",
    answer: "네, 맞습니다. .NP3는 니콘의 최신 '플렉시블 컬러(Flexible Color)' 기능을 지원하는 포맷입니다. Zf, Z6III 등 최신 기종에서 더욱 정교한 색 표현이 가능합니다.",
  },
  {
    question: "D850이나 Z6(1세대) 같은 구형 기종에서도 사용할 수 있나요?",
    answer: "본 레시피는 최신 .NP3 규격으로 제작되었습니다. 구형 기종은 .NCP 포맷만 인식하기 때문에 해당 파일은 기기 내에서 직접 불러오기가 불가능할 수 있습니다. 구매 전 호환 기종 리스트를 반드시 확인해 주세요.",
  },
  {
    question: "SD카드 어디에 파일을 넣어야 카메라가 인식하나요?",
    answer: "SD카드를 컴퓨터에 연결한 후, 최상위 경로(Root)에 NIKON 폴더를 만드세요. 그 안에 CUSTOMPC라는 폴더를 생성하고 파일을 복사해 넣어야 합니다. (경로 예시: SD카드/NIKON/CUSTOMPC/파일명.NP3)",
  },
  {
    question: "카메라 메뉴에서 '파일을 찾을 수 없음' 메시지가 뜹니다.",
    answer: "폴더 이름이 정확한지 확인해 주세요. 반드시 대문자로 NIKON, CUSTOMPC라고 입력해야 합니다. 또한, 폴더 안에 파일이 제대로 들어있는지 다시 한번 점검해 보시기 바랍니다.",
  },
  {
    question: "커스텀 픽처 컨트롤 저장 슬롯이 가득 찼는데 어떻게 하나요?",
    answer: "니콘 카메라는 일반적으로 C1부터 C9까지 9개의 사용자 등록 슬롯을 제공합니다. 기존에 등록된 프로파일 중 사용하지 않는 항목을 삭제한 뒤 새 레시피를 등록해 주세요.",
  },
  {
    question: "촬영한 RAW 파일에도 이 색감이 그대로 유지되나요?",
    answer: "니콘 전용 소프트웨어인 NX Studio에서는 촬영 당시 설정한 색감이 그대로 유지됩니다. 하지만 어도비 라이트룸이나 캡쳐원에서는 각 소프트웨어의 해석 방식이 다르므로 별도의 .DNG 프로필이나 사전 설정이 필요할 수 있습니다.",
  },
  {
    question: "동영상 촬영 시에도 이 레시피를 적용할 수 있나요?",
    answer: "네, 가능합니다. 동영상 촬영 메뉴 내 '사진 설정과 동일하게 적용' 옵션을 선택하거나, 동영상 전용 픽처 컨트롤 메뉴에서 해당 프로파일을 직접 불러오면 됩니다.",
  },
  {
    question: "실제 촬영 결과물이 샘플 이미지와 너무 다릅니다.",
    answer: "색감은 촬영 당시의 화이트 밸런스(K값)와 노출 정도에 큰 영향을 받습니다. 가급적 레시피와 함께 제공된 권장 화이트 밸런스 값과 노출 보정 수치를 맞추어 촬영해 보시기 바랍니다.",
  },
  {
    question: "N-Log 촬영 중에도 이 프로파일을 적용할 수 있나요?",
    answer: "아니요, N-Log는 후보정을 전제로 하는 로그 촬영 모드이므로 픽처 컨트롤 적용이 해제됩니다. 이 레시피는 일반적인 표준(SDR) 촬영 환경에서 최고의 결과물을 내도록 설계되었습니다.",
  },
  {
    question: "니콘 이미징 클라우드(Imaging Cloud)를 통해 설치할 수 있나요?",
    answer: "네, 지원합니다. 이미징 클라우드 웹사이트에 본 프로파일(.NP3)을 업로드한 후, 카메라와 Wi-Fi를 연결하여 클라우드에서 직접 다운로드 및 등록이 가능합니다.",
  },
  {
    question: "SD카드를 넣었는데도 '불러오기/저장' 메뉴가 비활성화되어 있습니다.",
    answer: "SD카드가 정확히 삽입되었는지 확인해 주세요. 또한 카드의 쓰기 방지(Lock) 스위치가 내려가 있거나, 카메라가 촬영 대기 상태(셔터 반누름 등)일 경우 메뉴가 비활성화될 수 있습니다.",
  },
  {
    question: "특정 기종에서 지원하는 '그레인(입자)' 효과가 왜 안 보이나요?",
    answer: "그레인 효과는 하드웨어 수준에서 지원하는 기종(Zf 등)에서만 활성화됩니다. 해당 기능을 지원하지 않는 하드웨어나 구형 펌웨어에서는 입자감이 제외된 채 색감만 적용됩니다.",
  },
  {
    question: "어도비 라이트룸 프리셋과 본 상품의 차이점은 무엇인가요?",
    answer: "라이트룸 프리셋은 촬영 후 컴퓨터에서 적용하는 후보정 도구입니다. 반면, 본 상품은 카메라 본체에 직접 설치하여 촬영 단계에서 실시간으로 색감을 확인하며 촬영할 수 있는 '하드웨어 프로파일'입니다.",
  },
  {
    question: "한 번 결제하면 계속해서 사용할 수 있나요?",
    answer: "네, 한 번 구매하시면 영구적으로 소장하실 수 있습니다. 기기를 변경하더라도 지원되는 니콘 기종이라면 언제든 재설치하여 사용이 가능합니다.",
  },
  {
    question: "Z fc 모델을 사용 중인데 호환이 되나요?",
    answer: "Z fc의 경우 최신 펌웨어 업데이트 여부에 따라 .NP3 파일 지원 여부가 달라집니다. 구매 전 본인 기기의 펌웨어를 최신으로 업데이트하고 '플렉시블 컬러' 지원 여부를 확인하시기 바랍니다.",
  },
  {
    question: "구매한 파일을 친구와 공유해도 되나요?",
    answer: "본 상품은 1인 1라이선스로 판매됩니다. 파일을 타인과 공유하거나 무단으로 인터넷에 재배포하는 행위는 저작권법에 의해 엄격히 금지되며 법적 처벌을 받을 수 있습니다.",
  },
  {
    question: "파일을 다운로드받았는데 손상되었다고 나옵니다.",
    answer: "간혹 네트워크 불안정으로 파일이 불완전하게 다운로드되는 경우가 있습니다. 마이페이지에서 다시 다운로드를 시도해 보시고, 동일한 문제가 발생하면 고객센터로 문의 주시면 새 링크를 발송해 드립니다.",
  },
] as const;

function ConsultingFaqCard() {
  return (
    <div className="account-panel-card stack account-section-card consulting-faq-card">
      <p className="consulting-faq-title">
        자주 묻는 질문 (FAQ)
      </p>
      <ul className="consulting-faq-list">
        {FAQ_ITEMS.map((item, index) => (
          <li key={index} className="consulting-faq-item">
            <details>
              <summary>{item.question}</summary>
              <p>{item.answer}</p>
            </details>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default async function AccountConsultingPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const { id: openId } = await searchParams;
  // 디자인 모드: Clerk 로그인 없이 더미 데이터 표시
  if (isDesignMode) {
    return (
      <>
        <div className="account-panel-card stack account-section-card account-section-card-consulting">
          <ConsultingSection initialInquiries={mockInquiries} openId={undefined} />
        </div>
        <ConsultingFaqCard />
      </>
    );
  }

  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const user = await currentUser();
  const email = user?.primaryEmailAddress?.emailAddress ?? user?.emailAddresses[0]?.emailAddress;
  const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(" ") || null;

  let profile = null;
  let initialInquiries: Inquiry[] = [];

  try {
    profile = await syncProfile({ email, fullName });
    if (profile) {
      const result = await getInquiriesByProfile(profile.id, undefined, 1, 100);
      initialInquiries = result.inquiries;
    }
  } catch (error) {
    console.error("Failed to fetch consulting data:", error);
  }

  if (!profile) {
    return (
      <div className="account-panel-card stack">
        <h1>오류</h1>
        <p className="muted">프로필 정보를 불러올 수 없습니다.</p>
      </div>
    );
  }

  return (
    <>
      <div className="account-panel-card stack account-section-card account-section-card-consulting page-slide-down">
        <ConsultingSection initialInquiries={initialInquiries} openId={openId} />
      </div>
      <ConsultingFaqCard />
    </>
  );
}
