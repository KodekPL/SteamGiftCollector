// Steam Games Identifiers with cards (v001)

// Adds missing default games with cards to local storage
function applyGamesWithCards() {
    var steamGamesWithCards = [];

    if (localStorage.sgc_hasCards) {
        steamGamesWithCards = JSON.parse(localStorage.sgc_hasCards);
    }

    var defaultGamesWithCards = [353370,353380,570,230410,226320,363970,238960,218230,39120,99900,
                                 271290,212070,268420,206500,202090,222900,208090,335240,209870,262410,
                                 250740,282440,304030,256410,252150,218330,230860,206210,224600,47410,
                                 227700,250440,246280,239220,238260,227180,273110,263500,339280,298160,
                                 291480,260410,260430,355840,264360,263040,334030,345520,207230,214420,
                                 102700,235340,338540,240320,242720,234310,263540,317110,42160,328060,
                                 338340,330000,319150,51100,251970,289780,266450,336040,267790,201210,
                                 219700,223630,250420,338180,300040,315640,320590,351140,335330,240620,
                                 252470,280850,364710,282560,296550,375000,362130,313810,327880,352070,
                                 243240,296030,296300,310490,318020,327220,368790,370090,270910,251650,
                                 310470,330670,269710,292600,235540,317730,302670,312780,327520,348160,
                                 356640,359230,375010,355130,368990,96100,331710,373110,330350,104200,
                                 315430,263980,314020,204180,291010,274560,92100,355520,329950,29800,
                                 299460,341500,354850,343360,303390,258050,107310,237570,313020,344040,
                                 292620,214340,270550,300300,222660,307230,318430,259870,343270,285480,
                                 357900,286830,270330,339470,104900,275470,294230,312640,270090,219910,
                                 250400,298520,275080,277500,366890,266210,255300,304670,286660,374410,
                                 253650,289090,311120,222160,292380,229520,283660,271860,259640,292630,
                                 220860,294140,233230,251690,242530,320650,361830,266010,301190,278640,
                                 336380,275490,307350,332480,230050,360640,342580,326190,22230,257750,
                                 255280,70000,45100,254440,281750,263820,285840,280910,200910,268240,
                                 262590,317510,45400,289420,289440,351450,289400,34900,277870,92300,
                                 243450,367000,207420,296050,305800,313590,330470,211800,289220,289480,
                                 321260,368900,370100,264280,209520,306410,302470,263680,318570,291270,
                                 320690,311140,307170,277510,279520,324420,297100,317970,349950,241240,
                                 263320,284950,269270,2500,292570,301750,201420,233510,233530,72900,
                                 204360,306200,301200,264300,252570,320630,207370,311100,311080,325090,
                                 258890,257990,45500,289890,340310,340300,311060,293860,336280,244590,
                                 267060,326180,303510,357600,346180,283290,271550,265380,234290,271640,
                                 94300,235250,279260,40800,259600,105800,45450,295250,252330,223470,
                                 35700,269210,225160,80330,80350,80340,346850,245390,234160,319970,
                                 9940,340340,287020,344860,262690,302610,326720,307070,307340,278570,
                                 357280,346630,286040,271570,329830,264730,292410,356380,336090,375510,
                                 291390,312240,11200,267730,318100,319180,344750,286810,343340,375460,
                                 234490,325320,296590,310070,337730,295930,357770,301680,341380,345280,
                                 252630,215470,277490,214360,265330,270310,314250,11250,11260,258950,
                                 303340,285520,316970,290280,308040,297020,219640,22100,204240,307050,
                                 293880,303840,377760,328780,320670,324170,332790,333120,327410,220,
                                 300,282760,252670,46500,297290,206370,302490,266940,285010,336200,
                                 212110,18300,257120,253290,255870,342300,298820,243780,280140,231040,
                                 231310,248470,253470,46540,347430,262900,20500,243200,206440,235620,
                                 310080,98800,305050,252350,40950,266490,253030,302790,249330,239800,
                                 284750,259740,33680,271820,284830,284890,3800,284710,207530,311190,
                                 233700,220820,284730,340800,320150,261680,334690,216090,267360,46260,
                                 342610,244890,347560,338050,347590,333220,3820,3810,337420,70100,
                                 259430,270750,270760,375020,350630,281220,295850,300320,70110,257830,
                                 285960,333730,355760,267670,341060,252270,260250,96900,342970,238890,
                                 321950,256611,256576,368650,341390,342490,358960,365860,296220,301990,
                                 254880,243280,341070,249990,49600,363460,301150,277680,227480,286360,
                                 210170,302950,287340,219150,2400,274290,17710,258010,252550,39800,
                                 209190,342350,270810,251910,254200,277470,355430,346080,239450,365310,
                                 253570,282800,222140,275530,319270,322170,233740,284850,207400,284790,
                                 207380,296870,262210,354620,363790,298830,298840,351240,265790,291170,
                                 335550,220740,230820,338320,247020,238210,244070,225140,213850,25890,
                                 240970,277890,244090,204300,231740,40400,263620,3020,286500,343100,
                                 251210,211260,65300,285440,313400,107200,260570,263560,317710,261700,
                                 312630,263740,293900,252310,207080,246960,302690,251370,285800,220460,
                                 252370,304500,38600,280930,302120,343440,312720,271990,335840,371420,
                                 369560,345120,340450,329690,316660,344790,334840,280320,247660,274310,
                                 315670,262150,270630,331340,201570,248650,292200,251710,111800,73210,
                                 204080,361190,291710,293340,251410,338710,332710,217100,371440,326730,
                                 354930,234000,279480,248290,301540,307430,333740,341690,280500,280460,
                                 341860,339000,314210,48700,35720,372210,363410,231020,352120,345060,
                                 355080,253110,235360,283180,250580,311250,314290,328730,306550,267340,
                                 327650,285500,200170,214730,344300,338960,305640,270050,341160,550,
                                 234650,263880,217290,296240,299660,337270,263460,298790,332830,346510,
                                 214190,308000,263960,302850,233450,335670,299360,296470,203350,41070,
                                 313740,227000,259680,80310,80360,297120,233350,262790,262260,270490,
                                 223730,244870,212050,205910,238910,259550,248970,227220,328500,341120,
                                 211360,264220,335920,11280,319550,341730,287290,325150,341510,333260,
                                 359670,290320,341760,325870,341310,352140,355410,238280,273240,269890,
                                 310850,215690,331220,278930,270190,307600,316140,335790,315110,259390,
                                 337630,283230,351470,371570,265400,289600,349550,271730,257770,284140,
                                 303260,348980,241720,320400,305980,351400,291960,300220,292400,266330,
                                 268810,369370,291130,371400,323020,349440,237590,265670,371390,239070,
                                 263300,204630,321150,364270,252830,344230,228940,313360,284810,214610,
                                 250640,214590,214570,350010,357200,203830,214770,234390,352130,46750,
                                 265610,288930,288160,277430,297490,346340,316080,364480,361970,371550,
                                 241910,3830,249590,115100,302710,3700,233190,264540,330180,371330,
                                 303790,278620,345540,259830,258090,255370,365020,263080,320520,331200,
                                 285130,236490,212700,440,250180,251990,224820,275390,354240,268220,
                                 247240,251430,222640,241320,250380,357650,272600,327260,248190,229890,
                                 259410,338190,307090,322080,354310,300620,264140,226740,297410,342740,
                                 299780,341780,242110,263420,305480,259620,279920,233110,206190,248820,
                                 207320,251870,223810,359040,352210,246700,290710,222880,620,233270,
                                 238460,255320,209080,13230,233130,245170,287260,294440,336610,320840,
                                 244810,25800,348300,349680,287140,372970,284200,217140,259470,342240,
                                 294020,96300,258220,18400,283000,300540,207430,274620,209330,278530,
                                 354950,283020,340750,216130,296930,218640,232050,320610,252750,372480,
                                 307210,261110,222750,312610,328760,4760,290770,40970,243120,233720,
                                 91700,63710,279800,91200,234900,340520,360450,235820,324070,284770,
                                 310700,282030,273500,282010,266230,271670,296730,281860,333330,247140,
                                 263400,266250,269490,301050,111100,295730,368610,363330,323450,332410,
                                 332390,329770,268320,331570,330660,356170,340390,348400,291190,330620,
                                 289620,337980,322900,304460,205090,95000,334270,341470,285050,116100,
                                 205080,346040,330990,296850,207650,314460,211580,348530,312900,220900,
                                 340220,364900,242800,333580,264160,27000,211400,224540,315070,336710,
                                 336730,325160,228440,331760,339160,320790,288040,356090,236930,278360,
                                 293660,292370,239820,221540,239030,300550,253750,246420,283680,269030,
                                 266130,260330,252410,266110,313470,314030,45000,255340,306700,235980,
                                 377460,360030,326120,247000,288370,263860,350500,321110,283040,267900,
                                 268200,63800,364660,356540,263060,243800,24010,242570,258643,222618,
                                 328600,218410,345090,335200,342100,338980,344500,237930,219890,209540,
                                 262390,209670,252430,236090,333530,207350,208140,323320,306660,294460,
                                 252010,333690,339700,365280,348270,357300,262830,323720,204530,113020,
                                 46770,303430,260530,230700,305780,262770,345340,253610,342650,334710,
                                 262960,364790,49520,237990,258970,257690,105600,319630,212680,258180,
                                 263760,44350,265930,42910,342380,113200,268540,296490,42960,242880,
                                 262120,72200,265950,40300,222730,244710,325520,347670,244730,293240,
                                 241410,270010,294750,317040,208600,326150,319250,250050,284390,209950,
                                 259510,301300,257080,72000,286320,227580,342620,262450,288020,210550,
                                 284180,307010,18820,269330,259780,264340,311870,299720,301380,277751,
                                 327980,368250,341530,346140,350810,317610,334560,371100,372820,335560,
                                 371890,358070,343430,360010,273070,346780,308360,270510,363920,333760,
                                 340330,225600,250340,338140,334070,280040,293940,265830,316840,227760,
                                 244690,211050,315340,238630,326950,344880,263360,102810,298850,232770,
                                 314200,247370,332730,253980,315920,205990,225420,273960,208520,227160,
                                 227280,296770,314150,1900,300610,315850,253960,308520,230310,310460,
                                 345640,342510,215770,347480,42140,360590,247310,348650,339290,340570,
                                 227680,246090,350490,236510,342090,302310,231720,302010,333860,262080,
                                 331400,295990,371000,348020,326480,241600,247910,269790,210770,225260,
                                 275180,227100,245150,264060,340880,351150,253630,304150,354860,57690,
                                 343780,331720,342450,285740,316600,340440,278440,310360,295490,327150,
                                 730,107100,237740,211340,341150,343020,333970,319830,238870,228300,
                                 231160,236730,274480,218060,346560,251850,311840,98200,334850,233840,
                                 227060,205610,310880,335830,366210,233290,4000,260130,329490,263020,
                                 333250,203630,225280,260160,251830,281920,91900,345200,327440,345860,
                                 249650,334620,329240,352780,337970,340360,371900,302650,341950,334290,
                                 359280,367780,276730,234530,347440,293420,281060,297740,306950,305010,
                                 330680,339500,234980,291330,226720,270210,370040,327310,285980,204450,
                                 244450,359440,314240,265870,350070,343090,370550,356070,258520,249050,
                                 327890,233980,348840,318480,279580,264260,229580,244410,238930,339800,
                                 337040,336420,335460,359580,352080,255420,348180,331580,335450,248530,
                                 201040,221380,227300,238320,314810,65930,251170,232430,318220,313140,
                                 299250,288880,8930,266840,209000,34030,218680,242700,239350,224480,
                                 237630,249870,95400,268830,339130,280540,22200,93200,219190,252710,
                                 257790,203210,302750,58230,219200,269670,331460,263520,318860,355530,
                                 268340,314450,340720,233250,362350,331980,310760,236130,220660,57740,
                                 215930,279720,15540,317440,328640,340070,269530,217690,246940,207150,
                                 250560,220090,355240,283080,365580,367110,334140,310810,261760,316790,
                                 72850,208750,250700,275670,239160,333600,248310,4920,270450,55230,
                                 201790,214560,308420,278910,224460,250260,252030,222440,235210,286260,
                                 24240,301970,293740,242780,331390,339400,319450,318260,314470,288060,
                                 223220,369290,363620,243950,352190,342020,304950,312510,332380,351090,
                                 312230,363500,299440,232750,222420,326670,255070,279440,253330,294370,
                                 282880,307570,317290,227020,268260,230650,226960,311680,335660,290990,
                                 42170,286200,348730,324270,200710,248610,289760,245470,262940,288470,
                                 315810,242840,246900,246840,276890,320540,303680,319320,284870,244430,
                                 347710,335090,369640,264000,369890,303690,313650,352960,227560,302870,
                                 360150,261180,324710,339460,356420,305490,320090,329430,340820,327670,
                                 293680,355050,343280,319230,351250,315080,320820,246300,366670,218820,
                                 305380,301920,346420,215530,262850,272470,218620,312540,219740,347620,
                                 234510,35450,18500,368360,329860,269310,323490,246580,322210,334420,
                                 353330,321830,253350,250030,325120,338890,336840,329380,351170,290970,
                                 321350,292480,291030,333660,264460,246800,269430,239120,292120,274940,
                                 279140,359900,282070,238430,325730,227800,291050,307190,335000,345080,
                                 207140,274270,280600,234920,333210,264240,322680,328270,300280,330270,
                                 247080,248860,320760,318530,339570,295110,287450,20920,251060,203160,
                                 238010,203140,200510,294860,35140,4700,1250,212480,254700,250620,
                                 91310,206420,222940,205650,10500,216250,8500,246400,237430,252970,
                                 322290,264560,336080,202170,318130,228960,264690,40390,359400,335900,
                                 364930,371280,251510,341680,370300,291430,347040,339690,325860,316180,
                                 315930,287600,257970,214870,361130,262750,293960,354050,296510,246980,
                                 249190,245050,281940,256010,267490,226560,230840,303830,303910,7510,
                                 314380,266050,314760,314770,339820,307130,263480,252770,280890,314570,
                                 321370,293920,111900,312220,250720,250280,325470,304170,247950,312530,
                                 282210,250900,251470,295790,311720,339200,325790,357720,344410,368180,
                                 266470,319740,294830,312750,346830,275200,200260,237890,246620,333510,
                                 290650,282640,287390,286690,251730,209060,108600,251150,221040,292140,
                                 253390,324260,341020,306440,335690,282590,207610,223670,317300,339860,
                                 274130,222615,318230,244030,300380,257510,312790,220440,262000,329130,
                                 300340,285820,251890,323850,346490,222180,295590,243300,71000,314830,
                                 220260,226580,105450,245620,211820,248390,298630,250760,326410,307580,
                                 296570,332610,342360,314360,322970,41800,373080,349530,286160,246110,
                                 321360,311770,297860,364300,342500,322600,315440,301980,286880,245300,
                                 316240,251130,358090,348550,265590,297920,292910,2870,232790,310890,
                                 282900,351710,317620,63380,322910,108710,339190,226620,239840,279900,
                                 289930,314980,264520,257670,296830,362660,264120,245130,236150,298480,
                                 228260,219990,223830,268050,8870,215280,304240,201270,301910,345820,
                                 222480,313080,249230,337150,252290,267750,238370,356530,297590,300840,
                                 324390,373440,284990,269110,312600,338060,291930,314580,222606,222638,
                                 365290,299480,266510,289130,243970,261570,314660,310510,321190,310740,
                                 293010,300200,242860,343710,322540,45760,340730,294810,362890,319910,
                                 352740,263640,353630,333390,344840,231430,253510,262060,221680,242640,
                                 332200,280720,365190,323380,363430,261640,349300,308270,204880,255710,
                                 246760,255500,253190,349320,252450,65980,236850,203770,302510,226840,
                                 318970,337680,337940,255220,324450,231330,237470,302270,298890,317330,
                                 277950,299890,314710,237850,241260,243930,316430,241930,265970,230190,
                                 310560,339210,312430,293280,313160,321040,245370,333980,232890,262280,
                                 265300,265550,249380,307960,329050,276810,313010,235380,214950,290790,
                                 240760,230230,279940,337930,321290,288220,286280,225360,275060,344630,
                                 107410,202970,325610,215630,291650,301640,326160,306640,323470,220200,
                                 238090,322850,312450,312370,234630,345660,226860,239140,225540,286570,
                                 218130,208650,307780,292030,363130,306130,281130];


    for (var i = 0; i < defaultGamesWithCards.length; i++) {
        var id = defaultGamesWithCards[i];

        if (!containsObject(steamGamesWithCards, id)) {
            steamGamesWithCards.push(id);
        }
    }

    localStorage.sgc_hasCards = JSON.stringify(steamGamesWithCards);
}

// Checks if array contains object
function containsObject(array, obj) {
    for (var i = 0; i < array.length; i++) {
        if (array[i] === obj) {
            return true;
        }
    }

    return false;
}

applyGamesWithCards();