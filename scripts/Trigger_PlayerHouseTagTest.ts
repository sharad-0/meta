import { CodeBlockEvents, Component, Entity, Player, PropTypes, TextGizmo } from 'horizon/core';

class Trigger_PlayerHouseTagTest extends Component<typeof Trigger_PlayerHouseTagTest>{
  static propsDefinition = {
    textObject: { type: PropTypes.Entity },
  };

  preStart() {
    this.connectCodeBlockEvent(this.entity, CodeBlockEvents.OnPlayerEnterTrigger, this.OnPlayerEnterTrigger.bind(this));
  }

  start() {

  }

  OnPlayerEnterTrigger(player: Player) {
    const playerName = player.name.get();
    const expectedTags = [`${playerName}_house`, `${playerName}_waffle`, `${playerName}_scoop`, `${playerName}_decor`];
    const allEntities = this.world.getEntitiesWithTags(expectedTags);
    this.props.textObject!.as(TextGizmo).text.set(`Entities with tags for player ${playerName}:\n ${allEntities.length} found.`);
    // console.log.*$
  }


}
Component.register(Trigger_PlayerHouseTagTest);