import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { IUserInterface } from '@app/common';

const getCurrentUserByContext = (context: ExecutionContext): IUserInterface => {
  return context.switchToHttp().getRequest().user;
};

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext) =>
    getCurrentUserByContext(context),
);
