import {
  Client,
  Timestamp,
  TopicMessage,
  TopicMessageQuery,
} from "@hashgraph/sdk";
import { Network } from "@swiss-digital-assets-institute/core";
import { TopicReaderOptions } from "@swiss-digital-assets-institute/resolver";

interface TopicReaderMessage {
  sequenceNumber: string;
  content: string;
}

export class TopicReaderHederaClient {
  async fetchAllToDate(
    topicId: string,
    network: Network
  ): Promise<TopicReaderMessage[]> {
    return this.fetchFrom(topicId, network, { from: 0, to: Date.now() });
  }

  async fetchFrom(
    topicId: string,
    network: Network,
    options: TopicReaderOptions
  ): Promise<TopicReaderMessage[]> {
    const client = Client.forName(network);
    const messages: TopicReaderMessage[] = [];

    return new Promise<TopicReaderMessage[]>((resolve, reject) => {
      const subscriptionHandler = new TopicMessageQuery()
        .setTopicId(topicId)
        .setStartTime(Timestamp.fromDate(new Date(options.from)))
        .setEndTime(Timestamp.fromDate(new Date(options.to)))
        .setMaxAttempts(0)
        .setCompletionHandler(() => {
          // Cleanup
          client.close();
          subscriptionHandler.unsubscribe();

          resolve(messages);
        })
        .subscribe(
          client,
          (_, error) => {
            // Cleanup
            client.close();
            subscriptionHandler.unsubscribe();

            if (
              error instanceof Error &&
              error.message.startsWith("5 NOT_FOUND:")
            ) {
              resolve(messages);
              return;
            }

            reject(error);
          },
          (message) => {
            const parsedMessage = this.parseMessage(message);
            messages.push(parsedMessage);
          }
        );
    });
  }

  private parseMessage(message: TopicMessage): TopicReaderMessage {
    const parsedMessage = Buffer.from(message.contents).toString("utf-8");
    return {
      sequenceNumber: message.sequenceNumber.toString(),
      content: parsedMessage,
    };
  }
}
