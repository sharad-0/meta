import { TextureAsset } from "horizon/2p";
import { World } from "horizon/core";
import { Asset, CodeBlockEvent, CodeBlockEvents } from "horizon/core";
import {
  AnimatedBinding,
  Animation,
  Binding,
  Easing,
  Image,
  ImageSource,
  Text,
  UIComponent,
  UINode,
  View,
} from "horizon/ui";

export default class UI_LoadingScreen extends UIComponent<
  typeof UI_LoadingScreen
> {
  Tips: string[] = [
    "Tip: Wrong ingredient? Don’t panic — just toss it and start fresh.",
    "Tip: Clean tables fast to keep customers coming!",
    "Tip: Check the recipe board before scooping — one miss and the sundae melts.",
    "Tip: A good scooper is only as good as their fetcher!",
    "Tip: Voice chat is your secret ingredient.",
    "Tip: A happy customer is everyone’s paycheck.",
  ];
  // rotation: Binding<string> = new Binding("0deg");
  // rotationDegree: number = 0;
  tipBindindg: Binding<string> = new Binding(
    "Tip: A happy customer is everyone’s paycheck."
  );
  Spinner_Animation: AnimatedBinding = new AnimatedBinding(0);
  Spinner_Rotation_In: number[] = [0, 1]; // Input values for interpolation (0% and 100% of animation).
  Spinner_Rotation_Out: string[] = ["0deg", "360deg"]; // Output values for interpolation (start and end rotation).
  counter: number = 0;
  initializeUI(): UINode {
    return View({
      children: [
        Image({
          source: ImageSource.fromTextureAsset(
            new Asset(BigInt("1050055790415282")) as TextureAsset
          ),
          style: {
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
          },
        }),
        this.LoadingTextComponent(),
        this.TipComponent(),
        this.circularLoader(),
      ],
      style: {
        backgroundColor: "rgba(0, 0, 0, 0)",
        height: "100%",
        width: "100%",
        zIndex: 1000,
      },
    });
  }

  LoadingTextComponent() {
    return View({
      children: [
        Text({
          text: "Loading...",
          style: {
            color: "white",
            fontSize: 42,
            fontWeight: "bold",
            marginBottom: 10,
            fontFamily: "Bangers",
            textAlign: "center",
            textAlignVertical: "center",
          },
        }),
      ],
      style: {
        width: "20%",
        height: "auto",
        aspectRatio: 176 / 66,
        // bottom: "30%",
        // right: "30%",
        left: "40%",
        bottom: "7%",
        position: "absolute",
        // backgroundColor: "rgbrgba(19, 41, 210, 0.75)",
      },
    });
  }
  circularLoader() {
    return View({
      children:
        // The spinning image.
        Image({
          source: ImageSource.fromTextureAsset(
            new Asset(BigInt("1516485616157687")) as TextureAsset
          ),
          style: {
            height: "100%",
            width: "100%",
            transform: [
              {
                rotate: this.Spinner_Animation.interpolate(
                  this.Spinner_Rotation_In,
                  this.Spinner_Rotation_Out
                ),
              },
            ],
          },
        }),

      style: {
        position: "absolute",
        width: "5%",
        height: "auto",
        aspectRatio: 1,
        bottom: "5%",
        right: "5%",
      },
    });
  }

  TipComponent() {
    return View({
      children: Text({
        text: this.tipBindindg,
        style: {
          color: "white",
          fontSize: 28,
          fontWeight: "bold",
          marginBottom: 10,
          fontFamily: "Bangers",
        },
      }),
      style: {
        width: "70%",
        height: "auto",
        aspectRatio: 10,
        bottom: 0,
        left: "15%",
        position: "absolute",
        // backgroundColor: "rgba(0, 0, 0, 0.75)",
        alignItems: "center",
        justifyContent: "center",
        padding: 10,
        borderRadius: 10,
      },
    });
  }

  start() {
    // this.startAnimating();
  }

  public startAnimating() {
    const RPM = 60;
    const rpms = (RPM * 1000) / 60;

    this.Spinner_Animation.set(
      Animation.repeat(
        Animation.sequence(
          Animation.timing(1, {
            duration: rpms,
            easing: Easing.inOut(Easing.linear),
          })
        ),
        60
      ),
      /* onEndNotification */ undefined
    );
    this.updateTipBinding();
  }

  updateTipBinding() {
    const randomIndex = Math.floor(Math.random() * this.Tips.length);
    this.tipBindindg.set(this.Tips[randomIndex]);
  }
}
UIComponent.register(UI_LoadingScreen);
