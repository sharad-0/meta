import * as hz from 'horizon/core';
import { Social, ProfileToFollow, SocialPlatformType } from 'horizon/social';

class OpenProfilesToFollow extends hz.Component<typeof OpenProfilesToFollow> {
  static propsDefinition = {
    profileHandle1: { type: hz.PropTypes.String },
    platform1: { type: hz.PropTypes.String, default: 'INSTAGRAM' },
    profileHandle2: { type: hz.PropTypes.String },
    platform2: { type: hz.PropTypes.String, default: 'HORIZON' },
    profileHandle3: { type: hz.PropTypes.String },
    platform3: { type: hz.PropTypes.String },
    profileHandle4: { type: hz.PropTypes.String },
    platform4: { type: hz.PropTypes.String },
    profileHandle5: { type: hz.PropTypes.String },
    platform5: { type: hz.PropTypes.String },
    profileHandle6: { type: hz.PropTypes.String },
    platform6: { type: hz.PropTypes.String },
    profileHandle7: { type: hz.PropTypes.String },
    platform7: { type: hz.PropTypes.String },
    profileHandle8: { type: hz.PropTypes.String },
    platform8: { type: hz.PropTypes.String },
    profileHandle9: { type: hz.PropTypes.String },
    platform9: { type: hz.PropTypes.String },
    profileHandle10: { type: hz.PropTypes.String },
    platform10: { type: hz.PropTypes.String },
  };

  preStart() {
    this.connectCodeBlockEvent(this.entity, hz.CodeBlockEvents.OnPlayerEnterTrigger, async (player) => {
      const rawProfiles = [
        this.parseProfile(this.props.profileHandle1, this.props.platform1),
        this.parseProfile(this.props.profileHandle2, this.props.platform2),
        this.parseProfile(this.props.profileHandle3, this.props.platform3),
        this.parseProfile(this.props.profileHandle4, this.props.platform4),
        this.parseProfile(this.props.profileHandle5, this.props.platform5),
        this.parseProfile(this.props.profileHandle6, this.props.platform6),
        this.parseProfile(this.props.profileHandle7, this.props.platform7),
        this.parseProfile(this.props.profileHandle8, this.props.platform8),
        this.parseProfile(this.props.profileHandle9, this.props.platform9),
        this.parseProfile(this.props.profileHandle10, this.props.platform10),
      ];

      const parsedProfiles = rawProfiles.filter(
        (profile) => profile?.profileHandle !== null && profile?.platform !== null && profile?.platform !== undefined
      ) as Array<ProfileToFollow>;

      console.log("Opening ProfilesToFollow page showing " + parsedProfiles.length + " profile(s)");

      await Social.showProfilesToFollow(player, parsedProfiles);
    });
  }

  start() {
  }

  parseProfile(
    profileHandle: string,
    platform: string
  ): ProfileToFollow | null {
    if(profileHandle.trim() === "" || platform.trim() === "") {
      return null;
    }

    const platformEnum = SocialPlatformType[platform.toUpperCase() as keyof typeof SocialPlatformType];
    if (platformEnum === null || platformEnum === undefined) {
      console.error("platform is invalid: \"" + platform + "\"");
      return null;
    }

    return {
      profileHandle,
      platform: platformEnum
    };
  };
}
hz.Component.register(OpenProfilesToFollow);
