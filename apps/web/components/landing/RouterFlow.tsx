import { Reveal } from "./Reveal";

export function RouterFlow() {
  return (
    <section className="mx-auto mt-24 max-w-[1280px] px-[30px]">
      <Reveal>
        <div className="mb-[30px] flex flex-wrap items-end justify-between gap-3">
          <h2 className="m-0 font-display text-[28px] leading-[1.04] tracking-[-0.01em] sm:text-[34px]">
            Any chain in. Arc execution. Any chain out.
          </h2>
          <span className="font-mono text-xs tracking-[0.16em] text-gold">
            THE ROUTER · GATEWAY + CCTP v2
          </span>
        </div>

        <div className="rounded-[10px] border border-ink-line bg-panel/50 p-2 pb-1">
          <svg viewBox="0 0 1180 300" className="block h-auto w-full overflow-visible">
            <defs>
              <marker id="ar" markerWidth={7} markerHeight={7} refX={5} refY={3} orient="auto">
                <path d="M0,0 L6,3 L0,6" fill="none" stroke="#B57E28" strokeWidth={1.2} />
              </marker>
              <symbol id="sym-usdc" viewBox="0 0 96 96">
                <path
                  d="M48 95C73.9574 95 95 73.9574 95 48C95 22.0426 73.9574 1 48 1C22.0426 1 1 22.0426 1 48C1 73.9574 22.0426 95 48 95Z"
                  fill="#0B53BF"
                />
                <path
                  d="M56.4609 13.7778V19.8291C68.5341 23.4716 77.3759 34.6928 77.3759 47.9997C77.3759 61.3066 68.5341 72.5278 56.4609 76.1703V82.2216C71.8534 78.4616 83.2509 64.5672 83.2509 47.9997C83.2509 31.4322 71.8534 17.5378 56.4609 13.7778Z"
                  fill="white"
                />
                <path
                  d="M18.625 47.9997C18.625 34.6928 27.4669 23.4716 39.54 19.8291V13.7778C24.1475 17.5378 12.75 31.4322 12.75 47.9997C12.75 64.5672 24.1475 78.4616 39.54 82.2216V76.1703C27.4669 72.5572 18.625 61.3066 18.625 47.9997Z"
                  fill="white"
                />
                <path
                  d="M60.6319 54.5506C60.6319 42.5362 41.8025 47.4713 41.8025 40.8325C41.8025 38.4531 43.7119 36.9256 47.3544 36.9256C51.7019 36.9256 53.2 39.0406 53.67 41.89H59.6625C59.1279 36.5426 56.0588 33.1662 50.9382 32.1604V27.4375H45.0632V31.9918C39.4534 32.7062 35.9275 35.973 35.9275 40.8325C35.9275 52.9056 54.7863 48.3819 54.7863 54.9031C54.7863 57.3706 52.4069 59.0156 48.3825 59.0156C43.1244 59.0156 41.3913 56.695 40.745 53.4931H34.8994C35.2781 59.3502 38.8897 63.0159 45.0632 63.9307V68.5625H50.9382V63.9923C56.9633 63.2139 60.6319 59.7089 60.6319 54.5506Z"
                  fill="white"
                />
              </symbol>
              <symbol id="sym-eurc" viewBox="0 0 96 96">
                <path
                  d="M48 96C74.5097 96 96 74.5097 96 48C96 21.4903 74.5097 0 48 0C21.4903 0 0 21.4903 0 48C0 74.5097 21.4903 96 48 96Z"
                  fill="#0B53BF"
                />
                <path
                  d="M58.2 59.4305C56.1 60.2705 53.82 60.7505 51.63 60.7505C47.2929 60.7505 43.2039 58.9034 41.25 54.4505H50.79L52.65 49.9505H40.1397C40.0806 49.3307 40.05 48.6812 40.05 48.0005C40.05 47.3198 40.0806 46.6703 40.1397 46.0505H54.24L56.1 41.5505H41.25C43.2039 37.0976 47.2929 35.2505 51.63 35.2505C53.82 35.2505 56.1 35.7305 58.2 36.5705L60.12 32.0105C57.54 30.6605 54.63 30.0005 51.72 30.0005C44.6964 30.0005 37.5966 33.9272 35.0265 41.5505H30.42V46.0505H34.1037C34.0488 46.6823 34.02 47.3324 34.02 48.0005C34.02 48.6686 34.0485 49.3187 34.1037 49.9505H30.42V54.4505H35.0265C37.5966 62.0738 44.6964 66.0005 51.72 66.0005C54.63 66.0005 57.54 65.3405 60.12 63.9905L58.2 59.4305Z"
                  fill="white"
                />
                <path
                  d="M18 48.0003C18 34.4103 27.03 22.9503 39.36 19.2303V13.0503C23.64 16.8903 12 31.0803 12 48.0003C12 64.9203 23.64 79.1103 39.36 82.9503V76.7703C27.03 73.0803 18 61.5903 18 48.0003Z"
                  fill="white"
                />
                <path
                  d="M56.64 13.0503V19.2303C68.97 22.9503 78 34.4103 78 48.0003C78 61.5903 68.97 73.0503 56.64 76.7703V82.9503C72.36 79.1103 84 64.9203 84 48.0003C84 31.0803 72.36 16.8903 56.64 13.0503Z"
                  fill="white"
                />
              </symbol>
              <symbol id="sym-arc" viewBox="0 0 500 500">
                <rect width={500} height={500} rx={250} fill="#1B3158" />
                <path
                  d="M250.466 85C291.387 85 327.762 120.453 352.899 184.828C365.973 218.31 375.592 258.091 381.291 301.368C381.801 305.233 382.234 309.161 382.679 313.081C382.824 313.323 382.911 313.548 382.881 313.731C382.881 313.731 386.231 334.649 386.942 371.001H386.564C381.597 366.924 323.011 320.889 225.894 334.219C227.359 317.784 229.374 301.793 231.978 286.465C232.111 285.682 232.265 284.925 232.4 284.147C270.491 282.999 303.831 287.422 329.397 293.219C329.302 292.612 329.223 291.988 329.126 291.384C323.871 258.658 316.118 228.697 306.121 203.093C289.776 161.227 268.447 135.216 250.466 135.216C232.486 135.216 211.157 161.228 194.812 203.093C190.856 213.219 187.254 224.019 184.024 235.41C179.483 251.372 175.668 268.484 172.621 286.464C168.112 313.017 165.295 341.496 164.257 371.001H114C116.319 300.984 128.19 235.639 148.033 184.828C173.165 120.453 209.545 85.0002 250.466 85Z"
                  fill="white"
                />
              </symbol>
            </defs>

            <path id="pin1" d="M188,86 C 250,110 260,150 330,150 L 560,150" fill="none" stroke="#F5F1E6" strokeOpacity={0.22} strokeWidth={1.5} strokeDasharray="3 5" />
            <path id="pin2" d="M188,236 C 250,212 260,150 330,150 L 560,150" fill="none" stroke="#F5F1E6" strokeOpacity={0.22} strokeWidth={1.5} strokeDasharray="3 5" />
            <path id="pout1" d="M636,150 L 860,150 C 930,150 930,86 992,86" fill="none" stroke="#F5F1E6" strokeOpacity={0.22} strokeWidth={1.5} strokeDasharray="3 5" markerEnd="url(#ar)" />
            <path id="pout2" d="M636,150 L 860,150 C 930,150 930,236 992,236" fill="none" stroke="#F5F1E6" strokeOpacity={0.22} strokeWidth={1.5} strokeDasharray="3 5" markerEnd="url(#ar)" />

            <rect x={296} y={121} width={128} height={58} rx={8} fill="#1B3158" />
            <text x={360} y={147} textAnchor="middle" className="font-mono" fontSize={12} fill="#F5F1E6" fontWeight={700} letterSpacing={1}>
              CIRCLE
            </text>
            <text x={360} y={164} textAnchor="middle" className="font-mono" fontSize={9} fill="#7EF1B3">
              GATEWAY · CCTP v2
            </text>

            <g>
              <rect x={40} y={62} width={150} height={48} rx={10} fill="#16233B" stroke="rgba(245,241,230,0.18)" />
              <use href="#sym-usdc" x={54} y={72} width={28} height={28} />
              <text x={92} y={82} className="font-mono" fontSize={13} fill="#F5F1E6" fontWeight={700}>BASE</text>
              <text x={92} y={98} className="font-mono" fontSize={10} fill="#8B98AC">USDC</text>
              <rect x={40} y={212} width={150} height={48} rx={10} fill="#16233B" stroke="rgba(245,241,230,0.18)" />
              <use href="#sym-usdc" x={54} y={222} width={28} height={28} />
              <text x={92} y={232} className="font-mono" fontSize={13} fill="#F5F1E6" fontWeight={700}>ARBITRUM</text>
              <text x={92} y={248} className="font-mono" fontSize={10} fill="#8B98AC">USDC</text>
            </g>

            <circle cx={600} cy={150} r={46} fill="none" stroke="#C0882E" strokeWidth={2} opacity={0}>
              <animate attributeName="r" values="40;40;62;40" keyTimes="0;0.42;0.5;0.6" dur="6s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0;0;0.55;0" keyTimes="0;0.42;0.5;0.62" dur="6s" repeatCount="indefinite" />
            </circle>
            <use href="#sym-arc" x={566} y={116} width={68} height={68} style={{ filter: "drop-shadow(0 6px 14px rgba(0,0,0,0.35))" }} />
            <text x={600} y={212} textAnchor="middle" className="font-mono" fontSize={12} fill="#F5F1E6" fontWeight={700}>ARC · KEYSTONE BOOK</text>
            <text x={600} y={228} textAnchor="middle" className="font-mono" fontSize={10} fill="#E7B25A">MATCH USDC ⇄ EURC · ON-CHAIN</text>

            <g>
              <rect x={990} y={62} width={150} height={48} rx={10} fill="#16233B" stroke="rgba(245,241,230,0.18)" />
              <use href="#sym-eurc" x={1004} y={72} width={28} height={28} />
              <text x={1042} y={82} className="font-mono" fontSize={13} fill="#F5F1E6" fontWeight={700}>ANY CHAIN</text>
              <text x={1042} y={98} className="font-mono" fontSize={10} fill="#8B98AC">EURC / USDC OUT</text>
              <rect x={990} y={212} width={150} height={48} rx={10} fill="#16233B" stroke="rgba(245,241,230,0.18)" />
              <use href="#sym-usdc" x={1004} y={222} width={28} height={28} />
              <text x={1042} y={232} className="font-mono" fontSize={13} fill="#F5F1E6" fontWeight={700}>EARN</text>
              <text x={1042} y={248} className="font-mono" fontSize={10} fill="#8B98AC">RESERVE YIELD</text>
            </g>

            <g opacity={0}>
              <use href="#sym-usdc" x={-13} y={-13} width={26} height={26} />
              <animateMotion dur="6s" repeatCount="indefinite" calcMode="linear" keyPoints="0;1;1" keyTimes="0;0.42;1">
                <mpath href="#pin1" />
              </animateMotion>
              <animate attributeName="opacity" values="1;1;0;0" keyTimes="0;0.4;0.46;1" dur="6s" repeatCount="indefinite" />
            </g>
            <g opacity={0}>
              <use href="#sym-usdc" x={-13} y={-13} width={26} height={26} />
              <animateMotion dur="6s" repeatCount="indefinite" calcMode="linear" keyPoints="0;1;1" keyTimes="0;0.42;1">
                <mpath href="#pin2" />
              </animateMotion>
              <animate attributeName="opacity" values="1;1;0;0" keyTimes="0;0.4;0.46;1" dur="6s" repeatCount="indefinite" />
            </g>
            <g opacity={0}>
              <use href="#sym-eurc" x={-13} y={-13} width={26} height={26} />
              <animateMotion dur="6s" repeatCount="indefinite" calcMode="linear" keyPoints="0;0;1;1" keyTimes="0;0.5;0.92;1">
                <mpath href="#pout1" />
              </animateMotion>
              <animate attributeName="opacity" values="0;0;1;1;0;0" keyTimes="0;0.5;0.56;0.9;0.95;1" dur="6s" repeatCount="indefinite" />
            </g>
            <g opacity={0}>
              <use href="#sym-usdc" x={-13} y={-13} width={26} height={26} />
              <animateMotion dur="6s" repeatCount="indefinite" calcMode="linear" keyPoints="0;0;1;1" keyTimes="0;0.54;0.92;1">
                <mpath href="#pout2" />
              </animateMotion>
              <animate attributeName="opacity" values="0;0;1;1;0;0" keyTimes="0;0.54;0.6;0.9;0.95;1" dur="6s" repeatCount="indefinite" />
            </g>
          </svg>
          <div className="mt-1 flex justify-between border-t border-ink/12 px-3.5 pb-2 pt-2.5 font-mono text-[11px] tracking-[0.06em] text-ink-faint">
            <span>1 · UNIFIED BALANCE IN — GATEWAY</span>
            <span>2 · MATCHED ON THE BOOK — ~780ms</span>
            <span>3 · SETTLE OUT / EARN — ANY CHAIN</span>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
